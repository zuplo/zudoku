import { useMDXComponents } from "@mdx-js/react";
import type { RootContent } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type {
  MdxJsxFlowElementHast,
  MdxJsxTextElementHast,
} from "mdast-util-mdx-jsx";
import type { MDXComponents } from "mdx/types.js";
import { createElement, Fragment, type ReactNode } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

type MdxJsxElement = MdxJsxFlowElementHast | MdxJsxTextElementHast;

const isMdxJsxElement = (node: RootContent): node is MdxJsxElement =>
  node.type === "mdxJsxTextElement" || node.type === "mdxJsxFlowElement";

const convertNode = (
  node: RootContent,
  components: MDXComponents,
): ReactNode => {
  if (isMdxJsxElement(node)) {
    // Fragment if no name, otherwise look up component or use name as HTML tag
    const Component = node.name
      ? (components[node.name] ?? node.name)
      : Fragment;

    const props = Object.fromEntries(
      node.attributes.flatMap((attr): [string, unknown][] => {
        if (attr.type !== "mdxJsxAttribute") return [];
        const { name, value } = attr;

        if (value == null) return [[name, true]];

        if (["string", "number", "boolean"].includes(typeof value)) {
          return [[name, value]];
        }

        return [];
      }),
    );

    const children = node.children.map((child) =>
      convertNode(child, components),
    );

    return createElement(Component, props, ...children);
  }

  return toJsxRuntime(node, { Fragment, jsx, jsxs, components });
};

const HastRichText = ({
  children,
  overrides,
}: {
  children: RootContent[];
  overrides?: MDXComponents;
}) => {
  const components = useMDXComponents(overrides);

  return children.map((node, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: Stable content from markdown AST
    <Fragment key={i}>{convertNode(node, components)}</Fragment>
  ));
};

export default HastRichText;
