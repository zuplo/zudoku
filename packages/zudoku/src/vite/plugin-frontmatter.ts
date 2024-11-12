import { glob } from "glob";
import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import type { Plugin } from "vite";
import type { ZudokuPluginOptions } from "../config/config.js";

// This plugin is responsible to restart the dev server when the frontmatter changed inside a markdown file.
export const viteFrontmatterPlugin = (
  getConfig: () => ZudokuPluginOptions,
): Plugin => ({
  // set enforce: "pre" so it's run before the MDX plugin
  enforce: "pre",
  name: "zudoku-frontmatter-plugin",
  configureServer: async ({ watcher, restart }) => {
    const config = getConfig();
    const files = await glob("**/*.{md,mdx}", {
      cwd: config.rootDir,
      ignore: ["node_modules", "dist"],
      absolute: true,
    });

    const frontmatterMap = new Map<string, object>(
      await Promise.all(
        files.map(async (file) => {
          const content = await readFile(file, "utf-8");
          const fm = matter(content);
          return [file, fm.data] as const;
        }),
      ),
    );

    watcher.on("change", async (filePath) => {
      if (/\.mdx?$/.test(filePath)) {
        const fm = matter(await readFile(filePath, "utf-8"));
        const prevFm = frontmatterMap.get(filePath);

        if (prevFm && JSON.stringify(prevFm) !== JSON.stringify(fm.data)) {
          frontmatterMap.set(filePath, fm.data);
          await restart();
        }
      }
    });
  },
});
