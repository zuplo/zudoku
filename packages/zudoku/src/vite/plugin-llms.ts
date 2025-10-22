import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { matchPath } from "react-router";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { ProtectedRoutesSchema } from "../config/validators/ProtectedRoutesSchema.js";
import {
  DocsConfigSchema,
  type ZudokuLlmsConfig,
} from "../config/validators/validate.js";
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
  let llmsConfig: ZudokuLlmsConfig | undefined;

  return {
    name: "zudoku-llms-plugin",
    async buildStart() {
      const config = getCurrentConfig();

      if (config.__meta.mode === "standalone" || !config.docs) {
        return;
      }

      // Parse docs config to get llms config with defaults
      llmsConfig = DocsConfigSchema.parse(config.docs).llms;

      // Skip if publishMarkdown is disabled
      if (llmsConfig?.publishMarkdown === false) {
        return;
      }

      // Glob markdown files and resolve custom navigation paths
      markdownFiles = await resolveCustomNavigationPaths(
        config,
        await globMarkdownFiles(config, { absolute: true }),
      );

      // Filter out protected routes unless includeProtected is true
      if (llmsConfig && !llmsConfig.includeProtected) {
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
    async closeBundle() {
      const config = getCurrentConfig();

      if (
        process.env.NODE_ENV !== "production" ||
        Object.keys(markdownFiles).length === 0 ||
        !llmsConfig ||
        llmsConfig.publishMarkdown === false
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
          // Read the original markdown file
          const content = await readFile(filePath, "utf-8");

          // Parse and remove frontmatter
          const { content: markdownContent, data: frontmatter } =
            matter(content);

          // Build the final markdown with title from frontmatter if present
          let finalMarkdown = markdownContent;
          if (frontmatter.title) {
            // Add title as H1 at the beginning, matching the behavior in MdxPage.tsx
            finalMarkdown = `# ${frontmatter.title}\n${markdownContent}`;
          }

          // Store info for llms.txt generation
          markdownFileInfos.push({
            filePath,
            routePath,
            title: frontmatter.title,
            description: frontmatter.description,
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
      if (llmsConfig.llmsTxt !== false || llmsConfig.llmsTxtFull !== false) {
        const markdownInfoPath = path.join(distDir, ".markdown-info.json");
        await writeFile(
          markdownInfoPath,
          JSON.stringify({ markdownFileInfos, llmsConfig }, null, 2),
          "utf-8",
        );
      }
    },
  };
};

export default viteLlmsPlugin;
