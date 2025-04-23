import rehypeShikiFromHighlighter, {
  type RehypeShikiCoreOptions,
} from "@shikijs/rehype/core";
import type { Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, type JSX } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import type { Pluggable } from "unified";
import { visit } from "unist-util-visit";

export const defaultHighlightOptions = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
  defaultColor: false,
  inline: "tailing-curly-colon",
  addLanguageClass: true,
} satisfies RehypeShikiCoreOptions;

let highlighter: HighlighterCore | undefined;

if (!highlighter) {
  const engine =
    typeof window === "undefined"
      ? import("shiki/engine/oniguruma").then((m) =>
          m.createOnigurumaEngine(() => import("shiki/wasm")),
        )
      : import("shiki/engine/javascript").then((m) =>
          m.createJavaScriptRegexEngine({ forgiving: true }),
        );

  highlighter = await createHighlighterCore({
    themes: [
      import("@shikijs/themes/github-light"),
      import("@shikijs/themes/github-dark"),
    ],
    langs: [
      import("@shikijs/langs/html"),
      import("@shikijs/langs/css"),
      import("@shikijs/langs/json"),
      import("@shikijs/langs/javascript"),
      import("@shikijs/langs/typescript"),
      import("@shikijs/langs/tsx"),
      import("@shikijs/langs/markdown"),
      import("@shikijs/langs/mdx"),
      import("@shikijs/langs/objective-c"),
      import("@shikijs/langs/yaml"),
      import("@shikijs/langs/toml"),
      import("@shikijs/langs/bash"),
      import("@shikijs/langs/python"),
      import("@shikijs/langs/rust"),
      import("@shikijs/langs/sql"),
      import("@shikijs/langs/yaml"),
      import("@shikijs/langs/php"),
      import("@shikijs/langs/ruby"),
      import("@shikijs/langs/swift"),
      import("@shikijs/langs/kotlin"),
      import("@shikijs/langs/java"),
      import("@shikijs/langs/csharp"),
      import("@shikijs/langs/go"),
    ],
    langAlias: {
      markup: "html",
      svg: "xml",
      mathml: "xml",
      atom: "xml",
      ssml: "xml",
      rss: "xml",
      webmanifest: "json",
    },
    engine,
  });
}

const rehypeCodeBlockPlugin = () => (tree: Root) => {
  visit(tree, "element", (node, _index, parent) => {
    if (node.tagName === "code") {
      const isInline = parent?.type === "element" && parent.tagName !== "pre";
      node.properties["data-inline"] = JSON.stringify(isInline);
    }
  });
};

export const configuredShikiRehypePlugins = [
  [
    rehypeShikiFromHighlighter,
    highlighter,
    defaultHighlightOptions,
  ] satisfies Pluggable,
  rehypeCodeBlockPlugin,
];

export const highlight = (code: string, lang = "text") => {
  const value = highlighter.codeToHast(code, {
    lang,
    ...defaultHighlightOptions,
  });

  return toJsxRuntime(value, { Fragment, jsx, jsxs }) as JSX.Element;
};
