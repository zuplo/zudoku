import type { Root } from "mdast";
import type { MdxJsxAttribute, MdxJsxFlowElement } from "mdast-util-mdx";
import { visit } from "unist-util-visit";

const attr = (
  name: string,
  value: string | null | undefined,
): MdxJsxAttribute | undefined =>
  value != null ? { type: "mdxJsxAttribute", name, value } : undefined;

export const remarkCodeTabs = () => (tree: Root) => {
  visit(tree, "mdxJsxFlowElement", (node: MdxJsxFlowElement) => {
    if (node.name !== "CodeTabs") return;

    const newChildren: MdxJsxFlowElement["children"] = [];
    for (const child of node.children) {
      if (child.type === "code") {
        const attributes = [
          attr("language", child.lang),
          attr("meta", child.meta),
          attr("code", child.value),
        ].filter((a) => a !== undefined);

        newChildren.push({
          type: "mdxJsxFlowElement",
          name: "CodeTabPanel",
          attributes,
          children: [],
          data: { _mdxExplicitJsx: true },
        } as MdxJsxFlowElement);
        continue;
      }

      // Skip whitespace-only paragraph nodes between code blocks
      if (
        child.type === "paragraph" &&
        child.children.every((c) => c.type === "text" && !c.value.trim())
      ) {
        continue;
      }

      newChildren.push(child);
    }

    node.children = newChildren;
  });
};
