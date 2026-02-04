import type { Element, RootContent } from "hast";
import { headingRank } from "hast-util-heading-rank";
import { toString as hastToString } from "hast-util-to-string";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export type TocEntry = {
  depth: number;
  text: string;
  id?: string;
  children?: TocEntry[];
  /** Rich AST nodes for rendering (includes JSX components) */
  rich?: RootContent[];
};

export type Toc = TocEntry[];

declare module "vfile" {
  interface DataMap {
    toc: Toc;
  }
}

const rehypeExtractTocWithJsx: Plugin<[]> = () => (tree, vfile) => {
  const headings: TocEntry[] = [];

  visit(tree, "element", (node: Element) => {
    const level = headingRank(node);

    if (!level) return;

    const heading: TocEntry = {
      depth: level,
      text: hastToString(node),
      rich: node.children,
    };

    if (node.properties?.id) {
      heading.id = String(node.properties.id);
    }

    headings.push(heading);
  });

  vfile.data.toc = createTree(headings);
};

const createTree = (headings: TocEntry[]): Toc => {
  const root: TocEntry = { depth: 0, text: "", children: [] };
  const stack: TocEntry[] = [root];

  for (const heading of headings) {
    // biome-ignore lint/style/noNonNullAssertion: We check the length of the stack before
    while (stack.length > 1 && stack.at(-1)!.depth >= heading.depth) {
      stack.pop();
    }

    const parent = stack.at(-1) ?? root;
    parent.children ??= [];
    parent.children.push(heading);
    stack.push(heading);
  }

  return root.children ?? [];
};

export default rehypeExtractTocWithJsx;
