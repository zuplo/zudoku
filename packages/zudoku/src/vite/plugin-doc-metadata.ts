import { glob } from "glob";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { readFrontmatter } from "../lib/util/readFrontmatter.js";
import { reload } from "./plugin-config-reload.js";
import { invalidate as invalidateNavigation } from "./plugin-navigation.js";

const serializeMetadata = async (filePath: string): Promise<string> => {
  const fm = await readFrontmatter(filePath);
  const h1 = fm.content.match(/^#\s+(.*)$/m)?.[1];
  return JSON.stringify({ frontmatter: fm.data, h1 });
};

export const viteDocMetadataPlugin = (): Plugin => ({
  enforce: "pre",
  name: "zudoku-doc-metadata-plugin",
  configureServer: async (server) => {
    const config = getCurrentConfig();
    const files = await glob("**/*.{md,mdx}", {
      cwd: config.__meta.rootDir,
      ignore: ["node_modules", "dist"],
      absolute: true,
    });

    const metadataMap = new Map<string, string>(
      await Promise.all(
        files.map(
          async (file) => [file, await serializeMetadata(file)] as const,
        ),
      ),
    );

    server.watcher.on("all", async (event, filePath) => {
      if (event !== "change" && event !== "add") return;
      if (!/\.mdx?$/.test(filePath)) return;

      const metadata = await serializeMetadata(filePath);
      if (metadataMap.get(filePath) === metadata) return;

      metadataMap.set(filePath, metadata);
      invalidateNavigation(server);
      reload(server);
    });
  },
});
