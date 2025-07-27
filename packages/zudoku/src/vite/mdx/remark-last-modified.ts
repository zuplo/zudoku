import { stat } from "node:fs/promises";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";
import { parse, stringify } from "yaml";

export const remarkLastModified = () => {
  return async (tree: Root, vfile: VFile) => {
    const path = vfile.path;

    const mtime = path ? (await stat(path)).mtime : undefined;

    const date = mtime ?? new Date();

    const lastModifiedISO = date.toISOString();

    // Update the YAML frontmatter with the last modified time
    let hasYaml = false;
    visit(tree, "yaml", (node) => {
      hasYaml = true;
      const data = parse(node.value) ?? {};
      if (!data.lastModifiedTime) {
        data.lastModifiedTime = lastModifiedISO;
        node.value = stringify(data).trim();
      }
    });

    if (!hasYaml) {
      tree.children.unshift({
        type: "yaml",
        value: stringify({ lastModifiedTime: lastModifiedISO }).trim(),
      });
    }
  };
};
