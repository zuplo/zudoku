---
title: Code Blocks
sidebar_icon: braces
---

Zudoku supports code blocks in Markdown using the [Shiki](https://shiki.style/) syntax highlighting library.

## Syntax Highlighting

Code blocks are text blocks wrapped around by strings of 3 backticks. You may check out this reference for the specifications of MDX.

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

You can also use the [`SyntaxHighlight` component](../components/syntax-highlight) to render code blocks in TypeScript directly.

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

For more details, see the [Shiki Rehype documentation](https://shiki.style/packages/rehype#inline-code).

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

For a complete list of supported languages and their aliases, see the [Shiki Languages documentation](https://shiki.style/languages#bundled-languages).

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

```tsx {5-12} title=zudoku.config.ts
import { defaultLanguages, type ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  // ...
  syntaxHighlighting: {
    themes: {
      light: "vitesse-light",
      dark: "vitesse-dark",
    },
    // Extend default languages if needed
    languages: [...defaultLanguages, "powershell"],
  },
};
```

For a complete list of available themes and languages, see the list of [Shiki themes](https://shiki.style/themes) and [Shiki languages](https://shiki.style/languages).

## Default Supported Languages

By default, Zudoku supports the following languages for syntax highlighting:

- HTML/CSS - `html`, `css`
- JavaScript/TypeScript - `javascript`, `js`, `jsx`, `typescript`, `ts`, `tsx`
- Markdown - `markdown`, `md`
- JSON/YAML/TOML - `json`, `yaml`, `toml`
- Shell - `bash`, `sh`, `shell`
- Python - `python`
- Rust - `rust`
- SQL - `sql`
- PHP - `php`
- Ruby - `ruby`, `rb`
- Swift - `swift`
- Kotlin - `kotlin`
- Java - `java`
- C# - `csharp`, `cs`
- Go - `go`
- Objective-C - `objectivec`, `objc`

## ANSI Code Blocks

You can use the `ansi` language to highlight terminal outputs with ANSI escape sequences. This is useful for displaying colored terminal output, styled text, and other terminal-specific formatting.

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

For more details on ANSI highlighting, see the [Shiki documentation](https://shiki.style/languages#ansi).
