import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import { joinUrl } from "../../lib/util/joinUrl.js";

export const remarkNormalizeImageUrl = (basePath: string) => (tree: Root) => {
  visit(tree, "image", (node) => {
    if (
      node.url.startsWith("/") &&
      basePath &&
      !node.url.startsWith(basePath)
    ) {
      node.url = joinUrl(basePath, node.url);
    }
  });
};
