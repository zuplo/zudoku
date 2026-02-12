import path from "node:path";
import type { Root } from "mdast";
import type { VFile } from "vfile";
import { exportMdxjsConst } from "./utils.js";

export const remarkInjectFilepath =
  (rootDir: string) => (tree: Root, vfile: VFile) => {
    const relativePath = path
      .relative(rootDir, vfile.path)
      .split(path.sep)
      .join(path.posix.sep);
    tree.children.unshift(exportMdxjsConst("__filepath", relativePath));
  };
