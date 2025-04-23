import { memo } from "react";
import { MarkdownHooks, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { configuredShikiRehypePlugins } from "../shiki.js";
import { MdxComponents } from "../util/MdxComponents.js";

const remarkPlugins = [remarkGfm];
const rehypePlugins = [...configuredShikiRehypePlugins];

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
  }) => (
    <div className={className}>
      <MarkdownHooks
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{ ...MdxComponents, ...components }}
      >
        {content}
      </MarkdownHooks>
    </div>
  ),
);

Markdown.displayName = "Markdown";
