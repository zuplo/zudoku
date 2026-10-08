import rehypeShikiFromHighlighter, {
  type RehypeShikiCoreOptions,
} from "@shikijs/rehype/core";
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
} from "@shikijs/transformers";
import type { Element, Parents, Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { createElement, Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type {
  BundledTheme,
  CodeOptionsMultipleThemes,
  HighlighterCore,
} from "shiki";
import { getSingletonHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { Pluggable, Transformer } from "unified";
import { SKIP, visit } from "unist-util-visit";
import { HIGHLIGHT_CODE_BLOCK_CLASS } from "./shiki-constants.js";
import { cn } from "./util/cn.js";

export {
  HIGHLIGHT_CODE_BLOCK_CLASS,
  defaultLanguages,
} from "./shiki-constants.js";

export const highlighterPromise = getSingletonHighlighterCore({
  engine: createJavaScriptRegexEngine({ forgiving: true }),
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

const warnedLanguages = new Set<string>();

const warnUnloadedLanguage = (lang: string, highlighter: HighlighterCore) => {
  const resolved = highlighter.resolveLangAlias(lang);
  if (
    warnedLanguages.has(lang) ||
    resolved === "ansi" ||
    resolved === "text" ||
    // math blocks are not highlighted but left for math plugins (rehype-katex)
    resolved === "math" ||
    highlighter.getLoadedLanguages().includes(resolved)
  )
    return;
  warnedLanguages.add(lang);
  // biome-ignore lint/suspicious/noConsole: Intentional warning
  console.warn(
    `Language "${lang}" is not loaded for syntax highlighting. ` +
      `Add it to \`syntaxHighlighting.languages\` in your config. Falling back to plain text.\n` +
      `See https://zudoku.dev/docs/markdown/code-blocks#configuration`,
  );
};

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
        // `className` is only set on blocks Shiki left alone (e.g. math)
        class: cn(
          node.properties.className,
          node.properties.class,
          parent.properties.class,
        ),
      };
      parent.properties = {};
    }
  });
};

const rehypeWarnUnloadedLanguages =
  (highlighter: HighlighterCore) => () => (tree: Root) => {
    visit(tree, "element", (node) => {
      if (!node.properties.className) return;
      if (node.tagName !== "code" && node.tagName !== "pre") return;

      const lang = (node.properties.className as string[] | undefined)
        ?.find((c) => c.startsWith("language-"))
        ?.slice("language-".length);

      if (lang) warnUnloadedLanguage(lang, highlighter);
    });
  };

const isMathCodeBlock = (node: Element) => {
  const code = node.children[0];
  return (
    node.tagName === "pre" &&
    code?.type === "element" &&
    code.tagName === "code" &&
    Array.isArray(code.properties.className) &&
    code.properties.className.includes("language-math")
  );
};

// Shiki highlights every `<pre><code>` and falls back to plain text for unknown
// languages. For `math` blocks (```math fences and remark-math display math)
// that drops the `language-math` markup, so math plugins from `rehypePlugins`
// like rehype-katex, which run after the highlighter, can't render them
// anymore. Keep those blocks away from Shiki and leave them as they are.
const rehypeShikiSkipMath = (
  highlighter: HighlighterCore,
  options: RehypeShikiCoreOptions,
): Transformer<Root> => {
  const highlight = rehypeShikiFromHighlighter(highlighter, options);

  // Stays synchronous (unless Shiki lazy-loads languages) so it keeps working
  // with react-markdown's `runSync` in the runtime `Markdown` component.
  return (tree, file) => {
    const mathBlocks: Array<[parent: Parents, index: number, node: Element]> =
      [];

    visit(tree, "element", (node, index, parent) => {
      if (!parent || index === undefined || !isMathCodeBlock(node)) return;
      mathBlocks.push([parent, index, node]);
      // Shiki replaces nodes in place, so a placeholder keeps indices stable
      parent.children[index] = { type: "comment", value: "" };
      return SKIP;
    });

    const restoreMathBlocks = () => {
      for (const [parent, index, node] of mathBlocks) {
        parent.children[index] = node;
      }
    };

    const result = highlight(tree, file, () => undefined);
    if (result instanceof Promise) return result.then(restoreMathBlocks);

    restoreMathBlocks();
  };
};

export const createConfiguredShikiRehypePlugins = (
  highlighterInstance: HighlighterCore,
  themes: ThemesRecord = defaultHighlightOptions.themes,
) => [
  rehypeWarnUnloadedLanguages(highlighterInstance),
  [
    rehypeShikiSkipMath,
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
  const resolved = highlighter.resolveLangAlias(lang);
  // "ansi" is a special built-in shiki language that does not appear in
  // getLoadedLanguages() but is always available.
  const effectiveLang =
    resolved === "ansi" || highlighter.getLoadedLanguages().includes(resolved)
      ? lang
      : "text";

  if (effectiveLang !== lang) warnUnloadedLanguage(lang, highlighter);

  const value = highlighter.codeToHast(code, {
    lang: effectiveLang,
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
      code: ({ inline: _inline, ...props }) =>
        createElement("code", {
          ...props,
          "data-zudoku-runtime-shiki": true,
          className: cn(props.className, HIGHLIGHT_CODE_BLOCK_CLASS),
        }),
    },
  });
};
