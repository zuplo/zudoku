import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import type { Plugin } from "vite";

// This plugin is responsible to restart the dev server when the frontmatter changed inside a markdown file.
export const viteFrontmatterPlugin = (): Plugin => {
  const frontmatterMap = new Map<string, object>();

  return {
    // set enforce: "pre" so it's run before the MDX plugin
    enforce: "pre",
    name: "zudoku-frontmatter-plugin",
    configureServer: ({ watcher, restart }) => {
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
    async load(id) {
      if (/\.mdx?$/.test(id)) {
        const fm = matter(await readFile(id, "utf-8"));
        frontmatterMap.set(id, fm.data);
      }
    },
  };
};
