import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { matchPath } from "react-router";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { ProtectedRoutesSchema } from "../config/validators/ProtectedRoutesSchema.js";
import {
  globMarkdownFiles,
  resolveCustomNavigationPaths,
} from "./plugin-docs.js";

type MarkdownFileInfo = {
  filePath: string;
  routePath: string;
  title?: string;
  description?: string;
  content: string;
};

const processMarkdownFile = async (
  filePath: string,
): Promise<{ content: string; title?: string; description?: string }> => {
  const fileContent = await readFile(filePath, "utf-8");
  const { content: markdownContent, data: frontmatter } = matter(fileContent);

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
 * This plugin generates .md files for each document during the build process.
 * When you access a document like /foo/hello, you can add .md to the url
 * /foo/hello.md and get the raw markdown without frontmatter.
 *
 * It also generates llms.txt and llms-full.txt files following the spec at https://llmstxt.org/
 */
const viteLlmsPlugin = (): Plugin => {
  let markdownFiles: Record<string, string> = {};
  let markdownFileInfos: MarkdownFileInfo[] = [];

  return {
    name: "zudoku-llms-plugin",
    async buildStart() {
      const config = getCurrentConfig();
      const llmsConfig = config.docs?.llms;

      if (config.__meta.mode === "standalone" || !llmsConfig?.publishMarkdown) {
        return;
      }

      markdownFiles = await resolveCustomNavigationPaths(
        config,
        await globMarkdownFiles(config, { absolute: true }),
      );

      // Filter out protected routes unless includeProtected is true
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
    configureServer(server) {
      const config = getCurrentConfig();

      if (!config.docs?.llms?.publishMarkdown) return;

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" || !req.url?.endsWith(".md")) {
          return next();
        }

        const basePath = config.basePath ?? "";
        const routePath = req.url.slice(basePath.length).replace(/\.md$/, "");
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

      if (
        process.env.NODE_ENV !== "production" ||
        Object.keys(markdownFiles).length === 0 ||
        !config.docs?.llms?.publishMarkdown
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

          // Store info for llms.txt generation
          markdownFileInfos.push({
            filePath,
            routePath,
            title,
            description,
            content: finalMarkdown,
          });

          // Determine output path
          const outputFileName =
            routePath === "/" ? "/index.md" : `${routePath}.md`;
          const outputPath = path.join(distDir, outputFileName);

          // Ensure parent directory exists
          await mkdir(path.dirname(outputPath), { recursive: true });

          // Write the markdown file
          await writeFile(outputPath, finalMarkdown, "utf-8");
        } catch (error) {
          // biome-ignore lint/suspicious/noConsole: Logging allowed here
          console.warn(`Failed to export markdown for ${routePath}:`, error);
        }
      }

      // Store markdown file infos and config for llms.txt generation
      // This will be used by the prerender process
      if (config.docs.llms?.llmsTxt || config.docs.llms?.llmsTxtFull) {
        const markdownInfoPath = path.join(distDir, ".markdown-info.json");
        await writeFile(
          markdownInfoPath,
          JSON.stringify(
            { markdownFileInfos, llmsConfig: config.docs.llms },
            null,
            2,
          ),
          "utf-8",
        );
      }
    },
  };
};

export default viteLlmsPlugin;
