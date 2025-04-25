import rehypeShikiFromHighlighter, {
  type RehypeShikiCoreOptions,
} from "@shikijs/rehype/core";
import type { Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, type JSX } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { getSingletonHighlighter } from "shiki";
import type { Pluggable } from "unified";
import { visit } from "unist-util-visit";
import type { LanguageName } from "../config/validators/shiki.js";

const highlighter = await getSingletonHighlighter();

export const defaultHighlightOptions = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
  defaultColor: false,
  inline: "tailing-curly-colon",
  addLanguageClass: true,
  parseMetaString: (str) => {
    return Object.fromEntries(
      str
        .split(" ")
        .reduce((prev: [string, boolean | string][], curr: string) => {
          const [key, value] = curr.split("=");
          const isNormalKey = key && /^[a-z0-9]+$/i.test(key);
          if (isNormalKey) prev = [...prev, [key, value || true]];
          return prev;
        }, []),
    );
  },
} satisfies RehypeShikiCoreOptions;

export const defaultLanguages: LanguageName[] = [
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
    if (node.tagName === "code") {
      const isInline = parent?.type === "element" && parent.tagName !== "pre";
      node.properties["data-inline"] = JSON.stringify(isInline);
    }
  });
};

export const createConfiguredShikiRehypePlugins = (themes?: {
  light: string;
  dark: string;
}) => {
  return [
    [
      rehypeShikiFromHighlighter,
      highlighter,
      {
        ...defaultHighlightOptions,
        themes: themes ?? defaultHighlightOptions.themes,
      },
    ] satisfies Pluggable,
    rehypeCodeBlockPlugin,
  ];
};

export const highlight = (
  code: string,
  lang = "text",
  themes?: { light: string; dark: string },
) => {
  const value = highlighter.codeToHast(code, {
    lang,
    ...defaultHighlightOptions,
    themes: themes ?? defaultHighlightOptions.themes,
  });

  return toJsxRuntime(value, { Fragment, jsx, jsxs }) as JSX.Element;
};
