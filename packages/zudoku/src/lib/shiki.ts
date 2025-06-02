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
} from "shiki";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { Pluggable } from "unified";
import { visit } from "unist-util-visit";
import { cn } from "./util/cn.js";

const engine = createJavaScriptRegexEngine({ forgiving: true });
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

export const defaultHighlightOptions: RehypeShikiCoreOptions = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  } satisfies ThemesRecord,
  defaultColor: false,
  inline: "tailing-curly-colon",
  addLanguageClass: true,
  transformers: [transformerMetaHighlight(), transformerMetaWordHighlight()],
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
  "markdown",
  "mdx",
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

export const createConfiguredShikiRehypePlugins = (themes?: {
  light: BundledTheme;
  dark: BundledTheme;
}): Pluggable[] => {
  return [
    [
      rehypeShikiFromHighlighter,
      highlighter,
      {
        ...defaultHighlightOptions,
        themes: themes ?? defaultHighlightOptions.themes,
      } satisfies RehypeShikiCoreOptions,
    ] satisfies Pluggable,
    rehypeCodeBlockPlugin,
  ];
};

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
