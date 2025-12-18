import path from "node:path";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";

export const remarkLinkRewrite =
  (basePath = "") =>
  (tree: Root) => {
    visit(tree, "link", (node) => {
      if (!node.url) return;

      const base = path.join(basePath);
      if (basePath && node.url.startsWith(base)) {
        node.url = node.url.slice(base.length);
      } else if (
        !node.url.startsWith("http") &&
        !node.url.startsWith("mailto:") &&
        !node.url.startsWith("/") &&
        !node.url.startsWith("#")
      ) {
        node.url = path.join("../", node.url);
      }

      node.url = node.url.replace(/\.mdx?(#.*)?$/, "$1");
    });
  };
