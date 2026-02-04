import { name as isIdentifierName } from "estree-util-is-identifier-name";
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { exportMdxjsConst } from "./utils.js";

const rehypeExtractTocWithJsxExport: Plugin<[{ name?: string }?], Root> = ({
  name = "tableOfContents",
} = {}) => {
  if (!isIdentifierName(name)) {
    throw new Error(`Invalid identifier name: ${JSON.stringify(name)}`);
  }

  return (tree, vfile) => {
    if (vfile.data.toc == null) return;
    tree.children.unshift(exportMdxjsConst(name, vfile.data.toc));
  };
};

export default rehypeExtractTocWithJsxExport;
