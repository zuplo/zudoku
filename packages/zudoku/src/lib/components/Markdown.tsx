import { memo, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { createConfiguredShikiRehypePlugins } from "../shiki.js";
import { MdxComponents } from "../util/MdxComponents.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { Typography } from "./Typography.js";

const remarkPlugins = [remarkGfm];

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
        ...createConfiguredShikiRehypePlugins(
          syntaxHighlighting?.themes,
          syntaxHighlighting?.highlighter,
        ),
      ],
      [syntaxHighlighting?.themes, syntaxHighlighting?.highlighter],
    );

    const mdComponents = useMemo(
      () => ({ ...MdxComponents, ...components }),
      [components],
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
