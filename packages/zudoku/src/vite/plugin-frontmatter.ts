import { readFile } from "node:fs/promises";
import { glob } from "glob";
import matter from "gray-matter";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { yamlEngine } from "../lib/util/yamlEngine.js";
import { reload } from "./plugin-config-reload.js";
import { invalidate as invalidateNavigation } from "./plugin-navigation.js";

// This plugin is responsible to restart the dev server when the frontmatter changed inside a markdown file.
export const viteFrontmatterPlugin = (): Plugin => ({
  // set enforce: "pre" so it's run before the MDX plugin
  enforce: "pre",
  name: "zudoku-frontmatter-plugin",
  configureServer: async (server) => {
    const config = getCurrentConfig();
    const files = await glob("**/*.{md,mdx}", {
      cwd: config.__meta.rootDir,
      ignore: ["node_modules", "dist"],
      absolute: true,
    });

    const frontmatterMap = new Map<string, object>(
      await Promise.all(
        files.map(async (file) => {
          const content = await readFile(file, "utf-8");
          const fm = matter(content, { engines: { yaml: yamlEngine } });
          return [file, fm.data] as const;
        }),
      ),
    );

    server.watcher.on("all", async (event, filePath) => {
      if (event !== "change" && event !== "add") return;

      if (/\.mdx?$/.test(filePath)) {
        const fm = matter(await readFile(filePath, "utf-8"), {
          engines: { yaml: yamlEngine },
        });
        const prevFm = frontmatterMap.get(filePath);

        if (!prevFm || JSON.stringify(prevFm) !== JSON.stringify(fm.data)) {
          frontmatterMap.set(filePath, fm.data);
          invalidateNavigation(server);
          reload(server);
        }
      }
    });
  },
});
