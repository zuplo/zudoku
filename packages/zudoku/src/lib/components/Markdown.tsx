import { useMDXComponents } from "@mdx-js/react";
import type { Root } from "hast";
import { memo, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { useHighlighter } from "../hooks/useHighlighter.js";
import { createConfiguredShikiRehypePlugins } from "../shiki.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { Typography } from "./Typography.js";

const remarkPlugins = [remarkGfm];

// rehype-raw parses HTML per the HTML spec which lowercases all tag names.
// This plugin restores the original casing so react-markdown can match them
// against the components map (e.g. <strictmode> -> <StrictMode>).
const rehypeRestoreComponentCase: (
  componentNames: string[],
) => Plugin<[], Root> = (componentNames) => () => (tree) => {
  const lowerToOriginal = new Map(
    componentNames.map((name) => [name.toLowerCase(), name]),
  );
  visit(tree, "element", (node) => {
    const original = lowerToOriginal.get(node.tagName);
    if (!original) return;

    node.tagName = original;
  });
};

export const Markdown = memo(
  ({
    content,
    className,
    components,
  }: {
    content: string;
    className?: string;
    components?: Components;
  }) => {
    const { syntaxHighlighting } = useZudoku().options;
    const highlighter = useHighlighter();

    const mdxComponents = useMDXComponents();
    const mdComponents = useMemo(
      () => ({ ...mdxComponents, ...components }),
      [mdxComponents, components],
    );

    const rehypePlugins = useMemo(
      () => [
        rehypeRaw,
        rehypeRestoreComponentCase(Object.keys(mdComponents)),
        ...createConfiguredShikiRehypePlugins(
          highlighter,
          syntaxHighlighting?.themes,
        ),
      ],
      [syntaxHighlighting?.themes, highlighter, mdComponents],
    );

    return (
      <Typography className={className}>
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={mdComponents}
        >
          {content}
        </ReactMarkdown>
      </Typography>
    );
  },
);

Markdown.displayName = "Markdown";
