import { readFile } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import globParent from "glob-parent";
import matter from "gray-matter";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { DocsConfigSchema } from "../config/validators/validate.js";
import { joinUrl } from "../lib/util/joinUrl.js";

const ensureLeadingSlash = joinUrl;

const viteLlmsTxtPlugin = (): Plugin => {
  const virtualModuleId = "virtual:zudoku-llms-txt-data";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  return {
    name: "zudoku-llms-txt-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return;

      const config = getCurrentConfig();

      if (config.__meta.mode === "standalone") {
        return `export const markdownFiles = [];`;
      }

      const docsConfig = DocsConfigSchema.parse(config.docs ?? {});
      const markdownFiles: Array<{
        path: string;
        title: string;
        description?: string;
        content?: string;
      }> = [];

      // Collect all markdown files
      for (const globPattern of docsConfig.files) {
        const globbedFiles = await glob(globPattern, {
          root: config.__meta.rootDir,
          ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
          absolute: true,
          posix: true,
        });

        const parent = globParent(globPattern);

        for (const file of globbedFiles) {
          try {
            const fileContent = await readFile(file, "utf-8");
            const { data: frontmatter, content } = matter(fileContent);

            // Create the relative path from the parent directory
            const relativePath = path.relative(
              path.join(config.__meta.rootDir, parent),
              file,
            );
            const routePath = ensureLeadingSlash(
              relativePath.replace(/\.mdx?$/, ""),
            );

            // Extract title from frontmatter or first heading
            let title = frontmatter.title as string | undefined;
            if (!title) {
              // Try to extract from first h1 heading
              const headingMatch = content.match(/^#\s+(.+)$/m);
              title =
                headingMatch?.[1] ?? path.basename(file, path.extname(file));
            }

            // Get description from frontmatter
            const description = frontmatter.description as string | undefined;

            markdownFiles.push({
              path: routePath,
              title,
              description,
              content: content.trim(),
            });
          } catch (error) {
            // Skip files that can't be read or parsed
            // console.warn(`Could not process file ${file}:`, error);
          }
        }
      }

      // Sort files by path for consistent output
      markdownFiles.sort((a, b) => a.path.localeCompare(b.path));

      return `export const markdownFiles = ${JSON.stringify(markdownFiles, null, 2)};`;
    },
  };
};

export default viteLlmsTxtPlugin;
