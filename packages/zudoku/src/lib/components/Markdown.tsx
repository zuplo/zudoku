import { memo, useMemo } from "react";
import { MarkdownHooks, type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkComment from "remark-comment";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import remarkGfm from "remark-gfm";
import { createConfiguredShikiRehypePlugins } from "../shiki.js";
import { MdxComponents } from "../util/MdxComponents.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { Typography } from "./Typography.js";

const remarkPlugins = [
  remarkComment,
  remarkGfm,
  remarkDirective,
  remarkDirectiveRehype,
];

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
    const rehypePlugins = useMemo(
      () => [
        rehypeRaw,
        ...createConfiguredShikiRehypePlugins(syntaxHighlighting?.themes),
      ],
      [syntaxHighlighting?.themes],
    );

    const mdComponents = useMemo(
      () => ({ ...MdxComponents, ...components }),
      [components],
    );

    return (
      <Typography className={className}>
        <MarkdownHooks
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={mdComponents}
        >
          {content}
        </MarkdownHooks>
      </Typography>
    );
  },
);

Markdown.displayName = "Markdown";
