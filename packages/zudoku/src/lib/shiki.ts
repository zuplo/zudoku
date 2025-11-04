import rehypeShikiFromHighlighter, {
  type RehypeShikiCoreOptions,
} from "@shikijs/rehype/core";
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
} from "@shikijs/transformers";
import type { Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, type JSX } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type {
  BundledLanguage,
  BundledTheme,
  CodeOptionsMultipleThemes,
  HighlighterCore,
  ShikiTransformer,
} from "shiki";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { Pluggable } from "unified";
import { visit } from "unist-util-visit";
import { cn } from "./util/cn.js";

const engine = createJavaScriptRegexEngine({ forgiving: true });

/**
 * Preprocessor: Add meta attribute to mermaid blocks so transformer can detect them
 * Shiki preserves meta strings, so this survives the element replacement
 */
const rehypeMermaidPreprocessor = () => (tree: Root) => {
  visit(tree, "element", (node, _index, _parent) => {
    if (node.tagName !== "code") return;

    const classes = Array.isArray(node.properties.className)
      ? node.properties.className
      : [];

    const isMermaid = classes.some(
      (c: string | number) =>
        typeof c === "string" &&
        (c === "language-mermaid" || c === "lang-mermaid" || c === "mermaid"),
    );

    if (isMermaid) {
      // Add meta marker that Shiki WILL preserve
      // biome-ignore lint/suspicious/noExplicitAny: HAST property types don't include custom data attributes
      (node.data as any) = (node.data as any) || {};
      // biome-ignore lint/suspicious/noExplicitAny: HAST property types don't include custom data attributes
      (node.data as any).meta = "zudoku-mermaid";
    }
  });
};

/**
 * Custom Shiki transformer to mark mermaid code blocks
 * Detects blocks via meta string (which Shiki preserves)
 */
const transformerMermaid = (): ShikiTransformer => ({
  name: "mermaid-marker",
  code(node) {
    const meta = this.options.meta?.__raw || "";

    // Check if this was marked as mermaid via meta
    if (meta.includes("zudoku-mermaid")) {
      // Add language-mermaid class for downstream processing
      const classes = Array.isArray(node.properties.className)
        ? node.properties.className
        : [];
      if (!classes.includes("language-mermaid")) {
        classes.push("language-mermaid");
      }
      node.properties.className = classes;
    }
  },
});
export const highlighter = await createHighlighterCore({
  engine,
  langAlias: {
    markup: "html",
    svg: "xml",
    mathml: "xml",
    atom: "xml",
    ssml: "xml",
    rss: "xml",
    webmanifest: "json",
  },
});

type ThemesRecord = CodeOptionsMultipleThemes<BundledTheme>["themes"];

export const defaultHighlightOptions = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
  defaultColor: false,
  defaultLanguage: "text",
  fallbackLanguage: "text",
  inline: "tailing-curly-colon",
  addLanguageClass: true,
  transformers: [
    transformerMetaHighlight(),
    transformerMetaWordHighlight(),
    transformerMermaid(), // Mark mermaid blocks during Shiki processing
  ],
  parseMetaString: (str) => {
    // Matches key="value", key=value, or key attributes
    const matches = str.matchAll(
      /([a-z0-9]+)(?:=(["'])(.*?)\2|=(.*?)(?:\s|$)|(?:\s|$))/gi,
    );
    return Object.fromEntries(
      Array.from(matches).map((match) => {
        const key = match[1];
        const value = match[3] || match[4] || true;
        return [key, value];
      }),
    );
  },
} satisfies RehypeShikiCoreOptions;

export const defaultLanguages: BundledLanguage[] = [
  "shellscript",
  "javascript",
  "jsx",
  "typescript",
  "tsx",
  "graphql",
  "jsonc",
  "json",
  "python",
  "java",
  "go",
  "csharp",
  "kotlin",
  "objective-c",
  "php",
  "ruby",
  "swift",
  "css",
  "html",
  "xml",
  "yaml",
  "toml",
  "rust",
  "markdown",
  "mdx",
  "zig",
  "scala",
  "dart",
  "ocaml",
  "c",
  "cpp",
  "common-lisp",
  "elixir",
  "powershell",
];

const rehypeCodeBlockPlugin = () => (tree: Root) => {
  visit(tree, "element", (node, _index, parent) => {
    if (node.tagName !== "code") return;

    const isCodeBlock = parent?.type === "element" && parent.tagName === "pre";
    node.properties.inline = JSON.stringify(!isCodeBlock);

    // Pass through properties from <pre> to <code> so we can handle it in `code` only
    if (isCodeBlock) {
      const parentProps = structuredClone(parent.properties);
      node.properties = {
        ...node.properties,
        ...parentProps,
        class: cn(node.properties.class, parentProps.class),
      };
      parent.properties = {};
    }
  });
};

export const createConfiguredShikiRehypePlugins = (
  themes: ThemesRecord = defaultHighlightOptions.themes,
  highlighterInstance: HighlighterCore = highlighter,
) => [
  rehypeMermaidPreprocessor, // Add meta marker before Shiki
  [
    rehypeShikiFromHighlighter,
    highlighterInstance,
    { ...defaultHighlightOptions, themes },
  ] satisfies Pluggable,
  rehypeCodeBlockPlugin, // Merges parent props to code
];

export const highlight = (
  highlighter: HighlighterCore,
  code: string,
  lang = "text",
  themes: ThemesRecord = defaultHighlightOptions.themes,
) => {
  const value = highlighter.codeToHast(code, {
    lang,
    ...defaultHighlightOptions,
    themes,
  });

  return toJsxRuntime(value, { Fragment, jsx, jsxs }) as JSX.Element;
};
