import fs from "node:fs";
import path from "node:path";
import type { Root } from "mdast";
import colors from "picocolors";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

type ValidateLinksMode = "warn" | "error";

export const remarkValidateLinks =
  (mode: ValidateLinksMode = "warn") =>
  (tree: Root, vfile: VFile) => {
    const fileDir = path.dirname(vfile.path);

    visit(tree, "link", (node) => {
      if (!node.url) return;
      if (
        node.url.startsWith("http://") ||
        node.url.startsWith("https://") ||
        node.url.startsWith("mailto:") ||
        node.url.startsWith("#") ||
        node.url.startsWith("/")
      )
        return;

      const [urlWithoutHash] = node.url.split("#");

      if (!urlWithoutHash) return;

      if (!urlWithoutHash.match(/\.mdx?$/)) return;

      const resolved = path.resolve(fileDir, urlWithoutHash);

      if (fs.existsSync(resolved)) return;

      const line = node.position?.start.line ?? "?";
      const message = `Broken link: "${node.url}" in ${vfile.path}:${line}`;

      if (mode === "error") {
        vfile.fail(message);
      } else {
        // biome-ignore lint/suspicious/noConsole: intentional build warning
        console.warn(colors.yellow(message));
        vfile.message(message);
      }
    });
  };
