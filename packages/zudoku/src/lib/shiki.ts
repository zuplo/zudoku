import rehypeShikiFromHighlighter, {
  type RehypeShikiCoreOptions,
} from "@shikijs/rehype/core";
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
} from "@shikijs/transformers";
import type { Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { createElement, Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type {
  BundledLanguage,
  BundledTheme,
  CodeOptionsMultipleThemes,
  HighlighterCore,
} from "shiki";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { Pluggable } from "unified";
import { visit } from "unist-util-visit";
import { cn } from "./util/cn.js";

export const HIGHLIGHT_CODE_BLOCK_CLASS =
  "overflow-x-auto scrollbar not-inline";

const engine = createJavaScriptRegexEngine({ forgiving: true });

const shikiPromise = import.meta.hot?.data?.shiki
  ? import.meta.hot.data.shiki
  : createHighlighterCore({
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

if (import.meta.hot?.data) {
  import.meta.hot.data.shiki = shikiPromise;
}

export const highlighter = await shikiPromise;

type ThemesRecord = CodeOptionsMultipleThemes<BundledTheme>["themes"];

export const parseMetaString = (str: string) => {
  const matches = str.matchAll(
    /([a-z0-9]+)(?:=(["'])(.*?)\2|=(.*?)(?:\s|$)|(?:\s|$))/gi,
  );
  return Object.fromEntries(
    Array.from(matches).map((match) => {
      const key = match[1];
      const raw = match[3] ?? match[4];
      const value =
        raw == null || raw === "true" ? true : raw === "false" ? false : raw;
      return [key, value];
    }),
  );
};

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
  transformers: [transformerMetaHighlight(), transformerMetaWordHighlight()],
  parseMetaString,
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
      node.properties = {
        ...node.properties,
        ...structuredClone(parent.properties),
        class: cn(node.properties.class, parent.properties.class),
      };
      parent.properties = {};
    }
  });
};

export const createConfiguredShikiRehypePlugins = (
  themes: ThemesRecord = defaultHighlightOptions.themes,
  highlighterInstance: HighlighterCore = highlighter,
) => [
  [
    rehypeShikiFromHighlighter,
    highlighterInstance,
    { ...defaultHighlightOptions, themes },
  ] satisfies Pluggable,
  rehypeCodeBlockPlugin,
];

export const highlight = (
  highlighter: HighlighterCore,
  code: string,
  lang = "text",
  themes: ThemesRecord = defaultHighlightOptions.themes,
  meta?: string,
) => {
  const value = highlighter.codeToHast(code, {
    lang,
    ...defaultHighlightOptions,
    themes,
    ...(meta && { meta: { __raw: meta } }),
  });

  // Shiki always outputs <pre><code>...</code></pre>, but callers of this
  // function (HighlightedCode, CodeTabs) provide their own wrapper so the
  // <pre> is unwanted. We reuse rehypeCodeBlockPlugin to merge <pre> props
  // onto <code>, then strip <pre> during JSX conversion.
  rehypeCodeBlockPlugin()(value);

  return toJsxRuntime(value, {
    Fragment,
    jsx,
    jsxs,
    components: {
      pre: (props) => props.children,
      code: (props) =>
        createElement("code", {
          ...props,
          className: cn(props.className, HIGHLIGHT_CODE_BLOCK_CLASS),
        }),
    },
  });
};
