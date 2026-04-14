import { useMDXComponents } from "@mdx-js/react";
import type { Root as MdastRoot, RootContent as MdastRootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { memo, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import type { Plugin } from "unified";
import { useHighlighter } from "../hooks/useHighlighter.js";
import { createConfiguredShikiRehypePlugins } from "../shiki.js";
import { MdxComponents } from "../util/MdxComponents.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { Typography } from "./Typography.js";

// Detects PascalCase JSX tags (likely custom components)
const HAS_JSX_COMPONENT = /<[A-Z]/;

// HTML void elements that need self-closing for MDX compatibility
const VOID_ELEMENT_RE =
  /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^>]*)?(?<!\/)>/gi;

// Pre-created extensions for MDX parse check (stateless, reusable)
const mdxMicromarkExtensions = [mdxjs()];
const mdxMdastExtensions = [mdxFromMarkdown()];

/**
 * Check if content can be parsed as valid MDX.
 */
const canParseMdx = (content: string): boolean => {
  try {
    fromMarkdown(content, {
      extensions: mdxMicromarkExtensions,
      mdastExtensions: mdxMdastExtensions,
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Convert void HTML elements to self-closing form for MDX compatibility.
 * e.g., <br> → <br />, <img src="x"> → <img src="x" />
 * Already self-closing tags (<br/>, <br />) are left unchanged.
 */
const preprocessForMdx = (content: string): string =>
  content.replace(VOID_ELEMENT_RE, "<$1$2 />");

/**
 * Remark plugin that converts MDX JSX nodes into raw HTML open/close tags
 * with their markdown children preserved as regular mdast nodes.
 *
 * This allows remark-rehype to convert the children to HAST normally,
 * and rehype-raw to parse the raw HTML tags into proper HAST elements.
 */
const remarkMdxJsxToHtml: Plugin<[], MdastRoot> = () => (tree) => {
  const convert = (node: { children?: MdastRootContent[] }) => {
    if (!node.children) return;
    // Iterate backwards so splicing doesn't shift unprocessed indices
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child: Record<string, unknown> = node.children[i] as never;
      if (
        child.type === "mdxJsxFlowElement" ||
        child.type === "mdxJsxTextElement"
      ) {
        const tagName = (child.name as string) ?? "div";
        const attrs = (
          (child.attributes as Array<{
            type: string;
            name: string;
            value: unknown;
          }>) ?? []
        )
          .filter((a) => a.type === "mdxJsxAttribute")
          .map((a) => {
            if (a.value == null) return ` ${a.name}`;
            return ` ${a.name}="${String(a.value)}"`;
          })
          .join("");

        const children = (child.children as MdastRootContent[]) ?? [];

        // Recursively convert nested mdxJsx in children first
        convert(child as { children?: MdastRootContent[] });

        const htmlNode = (value: string) =>
          ({ type: "html", value }) as unknown as MdastRootContent;

        if (children.length === 0) {
          // Self-closing: emit open+close pair (HTML parser ignores self-closing
          // on non-void elements, so use explicit close tag)
          node.children.splice(
            i,
            1,
            htmlNode(`<${tagName}${attrs}></${tagName}>`),
          );
        } else {
          node.children.splice(
            i,
            1,
            htmlNode(`<${tagName}${attrs}>`),
            ...children,
            htmlNode(`</${tagName}>`),
          );
        }
      } else {
        convert(child as { children?: MdastRootContent[] });
      }
    }
  };
  convert(tree);
};

const defaultRemarkPlugins = [remarkGfm];
const mdxRemarkPlugins = [remarkMdx, remarkGfm, remarkMdxJsxToHtml];

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

    // Include user-defined MDX components from the MDXProvider context
    const mdxCtxComponents = useMDXComponents();
    const allComponents = useMemo(() => {
      const merged: Record<string, unknown> = {
        ...mdxCtxComponents,
        ...MdxComponents,
        ...components,
      };
      // Add lowercase aliases for PascalCase components so they match
      // HTML-parsed (lowercased) tag names from rehype-raw
      for (const key of Object.keys(merged)) {
        const lower = key.toLowerCase();
        if (lower !== key && !(lower in merged)) {
          merged[lower] = merged[key];
        }
      }
      return merged as Components;
    }, [mdxCtxComponents, components]);

    const rehypePlugins = useMemo(
      () => [
        rehypeRaw,
        ...createConfiguredShikiRehypePlugins(
          highlighter,
          syntaxHighlighting?.themes,
        ),
      ],
      [syntaxHighlighting?.themes, highlighter],
    );

    // Check if content has JSX components and can be parsed as MDX
    const { mdxEnabled, processedContent } = useMemo(() => {
      if (!HAS_JSX_COMPONENT.test(content)) {
        return { mdxEnabled: false, processedContent: content };
      }
      const preprocessed = preprocessForMdx(content);
      if (canParseMdx(preprocessed)) {
        return { mdxEnabled: true, processedContent: preprocessed };
      }
      return { mdxEnabled: false, processedContent: content };
    }, [content]);

    return (
      <Typography className={className}>
        <ReactMarkdown
          remarkPlugins={mdxEnabled ? mdxRemarkPlugins : defaultRemarkPlugins}
          rehypePlugins={rehypePlugins}
          components={allComponents}
        >
          {processedContent}
        </ReactMarkdown>
      </Typography>
    );
  },
);

Markdown.displayName = "Markdown";
