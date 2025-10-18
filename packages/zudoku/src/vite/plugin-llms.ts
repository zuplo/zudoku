import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import globParent from "glob-parent";
import matter from "gray-matter";
import { matchPath } from "react-router";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { NavigationResolver } from "../config/validators/NavigationSchema.js";
import { ProtectedRoutesSchema } from "../config/validators/ProtectedRoutesSchema.js";
import {
  DocsConfigSchema,
  type ZudokuLlmsConfig,
} from "../config/validators/validate.js";
import { traverseNavigation } from "../lib/components/navigation/utils.js";
import { joinUrl } from "../lib/util/joinUrl.js";

const ensureLeadingSlash = joinUrl;

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
  // Store the map at plugin level so it's accessible in closeBundle
  let markdownFiles: Record<string, string> = {};
  let markdownFileInfos: MarkdownFileInfo[] = [];
  let llmsConfig: ZudokuLlmsConfig;

  return {
    name: "zudoku-llms-plugin",
    async buildStart() {
      const config = getCurrentConfig();

      if (config.__meta.mode === "standalone" || !config.docs) {
        return;
      }

      // Parse llms config with defaults
      llmsConfig = {
        publishMarkdown: true,
        llmsTxt: true,
        llmsTxtFull: true,
        includeProtected: false,
        ...config.llms,
      };

      // Skip if publishMarkdown is disabled
      if (!llmsConfig.publishMarkdown) {
        return;
      }

      // Map of route paths to original markdown file paths
      markdownFiles = {};

      // Helper to check if a route is protected
      const protectedRoutes = ProtectedRoutesSchema.parse(
        config.protectedRoutes,
      );
      const isProtectedRoute = (routePath: string): boolean => {
        if (!protectedRoutes || llmsConfig.includeProtected) {
          return false;
        }
        return Object.keys(protectedRoutes).some((route) =>
          matchPath({ path: route, end: true }, routePath),
        );
      };

      // Parse docs config to get defaults
      const docsConfig = DocsConfigSchema.parse(config.docs ?? {});

      for (const globPattern of docsConfig.files) {
        const globbedFiles = await glob(globPattern, {
          root: config.__meta.rootDir,
          ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
          absolute: true,
          posix: true,
        });

        // Normalize parent by removing leading `./` or `/`
        const parent = globParent(globPattern).replace(/^\.?\//, "");

        const toRoutePath = (file: string) => {
          const relativePath = path.posix.relative(parent, file);
          return ensureLeadingSlash(relativePath.replace(/\.mdx?$/, ""));
        };

        for (const file of globbedFiles) {
          const routePath = toRoutePath(file);
          // Skip protected routes unless includeProtected is true
          if (!isProtectedRoute(routePath)) {
            markdownFiles[routePath] = file;
          }
        }
      }

      // Handle custom paths from navigation config
      if (config.navigation) {
        const resolvedNavigation = await new NavigationResolver(
          config,
        ).resolve();

        traverseNavigation(resolvedNavigation, (item) => {
          const doc =
            item.type === "doc"
              ? { file: item.file, path: item.path }
              : item.type === "category" && item.link
                ? { file: item.link.file, path: item.link.path }
                : undefined;

          // Only continue if the doc has a custom path
          if (!doc || doc.path === doc.file) return;

          const fileRoutePath = ensureLeadingSlash(
            doc.file.replace(/\.mdx?$/, ""),
          );
          const filePath = markdownFiles[fileRoutePath];
          if (!filePath) return;

          const customPath = ensureLeadingSlash(doc.path);
          // Skip protected routes unless includeProtected is true
          if (!isProtectedRoute(customPath)) {
            markdownFiles[customPath] = filePath;
          }
          delete markdownFiles[fileRoutePath];
        });
      }
    },
    async closeBundle() {
      const config = getCurrentConfig();

      if (
        process.env.NODE_ENV !== "production" ||
        Object.keys(markdownFiles).length === 0
      ) {
        return;
      }

      // Re-parse llms config in case it wasn't set in buildStart
      llmsConfig = {
        publishMarkdown: true,
        llmsTxt: true,
        llmsTxtFull: true,
        includeProtected: false,
        ...config.llms,
      };

      // Double-check publishMarkdown is enabled
      if (!llmsConfig.publishMarkdown) {
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
      if (llmsConfig.llmsTxt || llmsConfig.llmsTxtFull) {
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
