---
title: Code Blocks
sidebar_icon: braces
description:
  Learn how to use code blocks, syntax highlighting, and advanced features like line highlighting
  and ANSI output in Zudoku Markdown with Shiki.
---

Zudoku supports code blocks in Markdown using the [Shiki](https://shiki.style/) syntax highlighting
library.

See examples for all supported languages in the
[Syntax Highlighting](../components/syntax-highlight#supported-languages) section.

## Syntax Highlighting

Code blocks are text blocks wrapped around by strings of 3 backticks. You may check out this
reference for the specifications of MDX.

````md
```js
console.log("Every repo must come with a mascot.");
```
````

The code block above will render as:

```js
console.log("Every repo must come with a mascot.");
```

:::note

You can also use the [`SyntaxHighlight` component](../components/syntax-highlight) to render code
blocks in TypeScript directly.

:::

## Inline Code

You can highlight inline code using either:

Regular backticks without language specification:

```md
`console.log("Hello World")`
```

Result: `console.log("Hello World")`

or with the [tailing curly colon syntax](https://shiki.matsu.io/packages/rehype#inline-code):

```md
`console.log("Hello World"){:js}`
```

Result: `console.log("Hello World"){:js}`

For more details, see the
[Shiki Rehype documentation](https://shiki.style/packages/rehype#inline-code).

You can add a title to code blocks by adding a title attribute after the backticks:

````md
```tsx title="hello.tsx"
console.log("Hello, World!");
```
````

Result:

```tsx title="hello.tsx"
console.log("Hello, World!");
```

For a complete list of supported languages and their aliases, see the
[Shiki Languages documentation](https://shiki.style/languages#bundled-languages).

## Advanced Syntax Highlighting

There are multiple ways to enhance syntax highlighting:

- [Line highlighting](https://shiki.style/packages/transformers#transformermetahighlight)
- [Word highlighting](https://shiki.style/packages/transformers#transformermetawordhighlight)
- Line numbers: `showLineNumbers`
- Title: `title`

Example:

````
```tsx {4-6} /react/ title="Example.tsx" showLineNumbers
import { useEffect } from "react";

function Example() {
  useEffect(() => {
    console.log("Mounted");
  }, []);

  return <div>Hello</div>;
}
```
````

Result:

```tsx {4-6} /react/ title="Example.tsx" showLineNumbers
import { useEffect } from "react";

function Example() {
  useEffect(() => {
    console.log("Mounted");
  }, []);

  return <div>Hello</div>;
}
```

## Configuration

You can configure syntax highlighting in your `zudoku.config.tsx`:

:::info

Changes to the syntax `highlighting` configuration require a restart of Zudoku to take effect.

:::

```tsx {5-15} title=zudoku.config.ts
import { defaultLanguages, type ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  // ...
  syntaxHighlighting: {
    themes: {
      light: "vitesse-light",
      dark: "vitesse-dark",
    },
    // Extend default languages with additional ones
    // Aliases like "lisp" are resolved automatically
    languages: [...defaultLanguages, "rust", "ruby", "php", "powershell"],
  },
};
```

For a complete list of available themes and languages, see the list of
[Shiki themes](https://shiki.style/themes) and [Shiki languages](https://shiki.style/languages).

## Default Supported Languages

By default, Zudoku supports the following languages for syntax highlighting:

- Shell - `shellscript`, `bash`, `sh`, `zsh`
- JavaScript/TypeScript - `javascript`, `typescript`, `jsx`, `tsx`
- Data formats - `json`, `jsonc`, `yaml`
- HTML/CSS/XML - `html`, `css`, `xml`
- Markdown - `markdown`, `mdx`
- Python - `python`
- Java - `java`
- Go - `go`
- GraphQL - `graphql`

Additional languages can be added via `syntaxHighlighting.languages` in your config. Languages not
in the list fall back to plain text with a console warning. You can use aliases (e.g. `lisp` for
`common-lisp`) and they will resolve automatically.

## ANSI Code Blocks

You can use the `ansi` language to highlight terminal outputs with ANSI escape sequences. This is
useful for displaying colored terminal output, styled text, and other terminal-specific formatting.

```ansi title="Terminal Output"
[0;32mcolored foreground[0m
[0;1mbold text[0m
[0;2mdimmed text[0m
[0;4munderlined text[0m
[0;7mreversed text[0m
[0;9mstrikethrough text[0m
[0;4;9munderlined + strikethrough text[0m
```

Usage:

````md
```ansi title="Terminal Output"
[0;32mcolored foreground[0m
[0;1mbold text[0m
[0;2mdimmed text[0m
[0;4munderlined text[0m
[0;7mreversed text[0m
[0;9mstrikethrough text[0m
[0;4;9munderlined + strikethrough text[0m
```
````

For more details on ANSI highlighting, see the
[Shiki documentation](https://shiki.style/languages#ansi).
