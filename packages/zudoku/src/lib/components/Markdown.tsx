import { memo } from "react";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { MdxComponents } from "../util/MdxComponents.js";
import { ReactMarkdown } from "./ReactMarkdown.js";

// same as in packages/dev-portal/framework/vite.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rehypeCodeBlockPlugin = () => (tree: any) => {
  visit(tree, "element", (node, _index, parent) => {
    if (node.tagName === "code") {
      node.properties.inline = String(parent?.tagName !== "pre");
    }
  });
};

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeCodeBlockPlugin, rehypeRaw];

// other styles are defined in main.css .prose
export const ProseClasses = "prose dark:prose-invert prose-neutral";

export const Markdown = memo(
  ({ content, className }: { content: string; className?: string }) => (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={MdxComponents}
      className={className}
    >
      {content}
    </ReactMarkdown>
  ),
);

Markdown.displayName = "Markdown";
