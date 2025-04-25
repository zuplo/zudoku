import { memo } from "react";
import { MarkdownHooks, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { createConfiguredShikiRehypePlugins } from "../shiki.js";
import { MdxComponents } from "../util/MdxComponents.js";
import { useZudoku } from "./context/ZudokuContext.js";

const remarkPlugins = [remarkGfm];

// other styles are defined in main.css .prose
export const ProseClasses = "prose dark:prose-invert prose-neutral";

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
    const rehypePlugins = createConfiguredShikiRehypePlugins(
      syntaxHighlighting?.themes,
    );

    return (
      <div className={className}>
        <MarkdownHooks
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={{ ...MdxComponents, ...components }}
        >
          {content}
        </MarkdownHooks>
      </div>
    );
  },
);

Markdown.displayName = "Markdown";
