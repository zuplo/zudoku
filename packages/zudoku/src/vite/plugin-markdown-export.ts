import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { matchPath } from "react-router";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { ProtectedRoutesSchema } from "../config/validators/ProtectedRoutesSchema.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { readFrontmatter } from "../lib/util/readFrontmatter.js";
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
const viteMarkdownExportPlugin = (): Plugin => {
  let markdownFiles: Record<string, string> = {};
  let markdownFileInfos: MarkdownFileInfo[] = [];

  return {
    name: "zudoku-markdown-export-plugin",
    applyToEnvironment(env) {
      return env.name === "ssr";
    },
    async buildStart() {
      const config = getCurrentConfig();
      const llmsConfig = config.docs?.llms;

      const needsMdFiles =
        config.docs?.publishMarkdown ||
        llmsConfig?.llmsTxt ||
        llmsConfig?.llmsTxtFull;

      if (config.__meta.mode === "standalone" || !needsMdFiles) {
        return;
      }

      markdownFiles = await resolveCustomNavigationPaths(
        config,
        await globMarkdownFiles(config, { absolute: true }),
      );

      // Filter out protected routes unless `includeProtected` is true
      if (!llmsConfig?.includeProtected) {
        const protectedRoutes = ProtectedRoutesSchema.parse(
          config.protectedRoutes,
        );
        if (protectedRoutes) {
          const isProtectedRoute = (routePath: string): boolean => {
            return Object.keys(protectedRoutes).some((route) =>
              matchPath({ path: route, end: true }, routePath),
            );
          };

          // Remove protected routes from the mapping
          for (const routePath of Object.keys(markdownFiles)) {
            if (isProtectedRoute(routePath)) {
              delete markdownFiles[routePath];
            }
          }
        }
      }
    },
    async configureServer(server) {
      const config = getCurrentConfig();
      const llmsConfig = config.docs?.llms;

      // Serve .md files if markdown export is needed
      const needsMdFiles =
        config.docs?.publishMarkdown ||
        llmsConfig?.llmsTxt ||
        llmsConfig?.llmsTxtFull;

      if (!needsMdFiles) return;

      markdownFiles = await resolveCustomNavigationPaths(
        config,
        await globMarkdownFiles(config, { absolute: true }),
      );

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" || !req.url?.endsWith(".md")) {
          return next();
        }

        const basePath = joinUrl(config.basePath);
        const routePath = joinUrl(
          req.url.slice(basePath.length).replace(/\.mdx?$/, ""),
        );
        const filePath = markdownFiles[routePath];

        if (!filePath) return next();

        try {
          const { content } = await processMarkdownFile(filePath);
          res.setHeader("Content-Type", "text/markdown; charset=utf-8");
          res.end(content);
        } catch (error) {
          // biome-ignore lint/suspicious/noConsole: Logging allowed here
          console.warn(`Failed to serve markdown for ${routePath}:`, error);
          return next();
        }
      });
    },
    async closeBundle() {
      const config = getCurrentConfig();
      const llmsConfig = config.docs?.llms;

      const needsMdFiles =
        config.docs?.publishMarkdown ||
        llmsConfig?.llmsTxt ||
        llmsConfig?.llmsTxtFull;

      if (
        process.env.NODE_ENV !== "production" ||
        Object.keys(markdownFiles).length === 0 ||
        !needsMdFiles
      ) {
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

          const outputFileName =
            routePath === "/" ? "/index.md" : `${routePath}.md`;
          const outputPath = path.join(distDir, outputFileName);

          await mkdir(path.dirname(outputPath), { recursive: true });

          await writeFile(outputPath, finalMarkdown, "utf-8");
        } catch (error) {
          // biome-ignore lint/suspicious/noConsole: Logging allowed here
          console.warn(`Failed to export markdown for ${routePath}:`, error);
        }
      }

      if (config.docs?.llms?.llmsTxt || config.docs?.llms?.llmsTxtFull) {
        const markdownInfoPath = path.join(
          config.__meta.rootDir,
          "node_modules/.zudoku/markdown-info.json",
        );
        await writeFile(
          markdownInfoPath,
          JSON.stringify(markdownFileInfos, null, 2),
          "utf-8",
        );
      }
    },
  };
};

export default viteMarkdownExportPlugin;
