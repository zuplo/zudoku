import path from "node:path";
import type { Root } from "mdast";
import type { VFile } from "vfile";
import { exportMdxjsConst } from "./utils.js";

export const remarkInjectFilepath =
  (rootDir: string) => (tree: Root, vfile: VFile) => {
    tree.children.unshift(
      exportMdxjsConst("__filepath", path.relative(rootDir, vfile.path)),
    );
  };
