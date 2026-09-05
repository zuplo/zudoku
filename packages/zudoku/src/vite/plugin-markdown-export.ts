import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";
import { type ConfigWithMeta, getCurrentConfig } from "../config/loader.js";
import {
  addAcceptToVary,
  negotiateContentType,
} from "../lib/util/contentNegotiation.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import {
  appendLinkHeader,
  encodeDocumentationRoutePath,
  getMarkdownAlternateLink,
  resolveDocumentationRoutePath,
} from "../lib/util/markdown-representation.js";
import { readFrontmatter } from "../lib/util/readFrontmatter.js";
import { matchesAnyProtectedPattern } from "../lib/util/url.js";
import {
  globMarkdownFiles,
  resolveCustomNavigationPaths,
} from "./plugin-docs.js";

export type MarkdownFileInfo = {
  filePath: string;
  routePath: string;
  title?: string;
  description?: string;
  content: string;
};

const MARKDOWN_FILES_MODULE_ID = "virtual:zudoku-markdown-files";
const RESOLVED_MARKDOWN_FILES_MODULE_ID = `\0${MARKDOWN_FILES_MODULE_ID}`;

const processMarkdownFile = async (
  filePath: string,
): Promise<{ content: string; title?: string; description?: string }> => {
  const { content: markdownContent, data: frontmatter } =
    await readFrontmatter(filePath);

  let finalMarkdown = markdownContent;
  if (frontmatter.title) {
    // Add title as H1 at the beginning, matching the behavior in MdxPage.tsx
    finalMarkdown = `# ${frontmatter.title}\n${markdownContent}`;
  }

  return {
    content: finalMarkdown,
    title: frontmatter.title,
    description: frontmatter.description,
  };
};

/**
 * This plugin exports markdown files (.md) for each document during the build process.
 * In development mode, you can access documents at their URL path with .md extension
 * (e.g., /foo/hello.md) to get the raw markdown without frontmatter.
 *
 * Markdown files are generated when:
 * - publishMarkdown is enabled (for copy button functionality)
 * - llmsTxt or llmsTxtFull is enabled (for generating llms.txt files)
 *
 * It also writes metadata to markdown-info.json used by the llms.txt generator.
 */
export const getMarkdownOutputPath = (distDir: string, routePath: string) => {
  const segments =
    routePath === "/" ? ["index"] : routePath.split("/").filter(Boolean);
  return `${path.join(distDir, ...segments)}.md`;
};

export const writeMarkdownInfo = async (
  markdownInfoPath: string,
  markdownFileInfos: MarkdownFileInfo[],
) => {
  await mkdir(path.dirname(markdownInfoPath), { recursive: true });
  await writeFile(
    markdownInfoPath,
    JSON.stringify(markdownFileInfos, null, 2),
    "utf-8",
  );
};

/**
 * Resolves a .md request URL to the route path used in the file mapping.
 * Strips query/hash, removes the .md(x) extension, and reverses the
 * "/index" → "/" mapping from getMarkdownPathname.
 */
export const resolveMarkdownRoutePath = (
  requestUrl: string,
  basePath: string,
): string | undefined => {
  const pathname = requestUrl.split(/[?#]/)[0]?.replace(/\.mdx?$/, "");
  if (!pathname) return;

  const routePath = resolveDocumentationRoutePath(pathname, basePath);
  if (!routePath) return;
  if (routePath === "/index") {
    return "/";
  }
  return routePath;
};

const needsMdFiles = (config: ConfigWithMeta) =>
  config.docs.publishMarkdown ||
  config.docs.llms.llmsTxt ||
  config.docs.llms.llmsTxtFull;

const isContentNegotiationEnabled = (config: Pick<ConfigWithMeta, "docs">) =>
  config.docs.publishMarkdown && config.docs.contentNegotiation;

const resolveMarkdownFiles = async (config: ConfigWithMeta) => {
  const files = await resolveCustomNavigationPaths(
    config,
    await globMarkdownFiles(config, { absolute: true }),
  );

  if (config.docs.llms.includeProtected || !config.protectedRoutes) {
    return files;
  }

  const patterns = Object.keys(config.protectedRoutes);
  return Object.fromEntries(
    Object.entries(files).filter(
      ([routePath]) => !matchesAnyProtectedPattern(patterns, routePath),
    ),
  );
};

const loadMarkdownContents = async (markdownFiles: Record<string, string>) =>
  Object.fromEntries(
    await Promise.all(
      Object.entries(markdownFiles).map(async ([routePath, filePath]) => [
        encodeDocumentationRoutePath(routePath),
        (await processMarkdownFile(filePath)).content,
      ]),
    ),
  );

type MarkdownDevRequest = {
  method?: string;
  url?: string;
  headers: { accept?: string };
};

type MarkdownDevResponse = {
  statusCode: number;
  getHeader: (name: string) => string | number | string[] | undefined;
  setHeader: (name: string, value: string) => unknown;
  end: (body?: string) => unknown;
};

export const createMarkdownDevMiddleware =
  ({
    config,
    getMarkdownFiles,
  }: {
    config: Pick<ConfigWithMeta, "basePath" | "docs">;
    getMarkdownFiles: () => Record<string, string>;
  }) =>
  async (
    req: MarkdownDevRequest,
    res: MarkdownDevResponse,
    next: () => void,
  ) => {
    if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) {
      return next();
    }

    const basePath = joinUrl(config.basePath);
    const pathname = req.url.split(/[?#]/)[0] ?? req.url;
    const isExplicitMarkdownRequest = pathname.endsWith(".md");
    const routePath = isExplicitMarkdownRequest
      ? resolveMarkdownRoutePath(req.url, basePath)
      : resolveDocumentationRoutePath(req.url, basePath);
    if (!routePath) return next();

    const filePath = Object.entries(getMarkdownFiles()).find(
      ([configuredRoutePath]) =>
        encodeDocumentationRoutePath(configuredRoutePath) === routePath,
    )?.[1];
    if (!filePath) return next();

    if (!isExplicitMarkdownRequest && isContentNegotiationEnabled(config)) {
      const negotiatedType = negotiateContentType(req.headers.accept);
      res.setHeader("Vary", addAcceptToVary(res.getHeader("Vary")?.toString()));
      res.setHeader(
        "Link",
        appendLinkHeader(
          res.getHeader("Link"),
          getMarkdownAlternateLink(routePath, config.basePath),
        ),
      );

      if (negotiatedType === null) {
        res.statusCode = 406;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.end(req.method === "HEAD" ? undefined : "Not Acceptable");
      }

      if (negotiatedType === "text/html") {
        return next();
      }
    } else if (!isExplicitMarkdownRequest) {
      return next();
    }

    try {
      const { content } = await processMarkdownFile(filePath);
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      return res.end(req.method === "HEAD" ? undefined : content);
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.warn(`Failed to serve markdown for ${routePath}:`, error);
      return next();
    }
  };

const viteMarkdownExportPlugin = (): Plugin => {
  let markdownFiles: Record<string, string> = {};
  let markdownFileInfos: MarkdownFileInfo[] = [];

  return {
    name: "zudoku-markdown-export-plugin",
    applyToEnvironment(env) {
      return env.name === "ssr";
    },
    resolveId(id) {
      if (id === MARKDOWN_FILES_MODULE_ID) {
        return RESOLVED_MARKDOWN_FILES_MODULE_ID;
      }
    },
    async load(id) {
      if (id === RESOLVED_MARKDOWN_FILES_MODULE_ID) {
        return `export default ${JSON.stringify(await loadMarkdownContents(markdownFiles))};`;
      }
    },
    async buildStart() {
      const config = getCurrentConfig();

      if (config.__meta.mode === "standalone" || !needsMdFiles(config)) {
        return;
      }

      markdownFiles = await resolveMarkdownFiles(config);
    },
    async configureServer(server) {
      const config = getCurrentConfig();

      // Serve .md files if markdown export is needed
      if (!needsMdFiles(config)) return;

      markdownFiles = await resolveMarkdownFiles(config);

      server.middlewares.use(
        createMarkdownDevMiddleware({
          config,
          getMarkdownFiles: () => markdownFiles,
        }),
      );
    },
    async closeBundle() {
      const config = getCurrentConfig();

      if (process.env.NODE_ENV !== "production" || !needsMdFiles(config)) {
        return;
      }

      // During build, write .md files to the dist directory
      const distDir = path.join(
        config.__meta.rootDir,
        "dist",
        config.basePath ?? "",
      );

      markdownFileInfos = [];

      for (const [routePath, filePath] of Object.entries(markdownFiles)) {
        try {
          const {
            content: finalMarkdown,
            title,
            description,
          } = await processMarkdownFile(filePath);

          markdownFileInfos.push({
            filePath,
            routePath,
            title,
            description,
            content: finalMarkdown,
          });

          const outputPath = getMarkdownOutputPath(distDir, routePath);

          await mkdir(path.dirname(outputPath), { recursive: true });

          await writeFile(outputPath, finalMarkdown, "utf-8");
        } catch (error) {
          // biome-ignore lint/suspicious/noConsole: Logging allowed here
          console.warn(`Failed to export markdown for ${routePath}:`, error);
        }
      }

      if (
        config.docs.llms.llmsTxt ||
        config.docs.llms.llmsTxtFull ||
        isContentNegotiationEnabled(config)
      ) {
        const markdownInfoPath = path.join(
          config.__meta.rootDir,
          "node_modules/.zudoku/markdown-info.json",
        );
        await writeMarkdownInfo(markdownInfoPath, markdownFileInfos);
      }
    },
  };
};

export default viteMarkdownExportPlugin;
