---
title: Code Blocks
sidebar_icon: braces
---

Zudoku supports code blocks in Markdown using the [Shiki](https://shiki.style/) syntax highlighting library.

## Syntax Highlighting

Code blocks are text blocks wrapped around by strings of 3 backticks. You may check out this reference for the specifications of MDX.

````markdown
```js
console.log("Every repo must come with a mascot.");
```
````

The code block above will render as:

```js
console.log("Every repo must come with a mascot.");
```

:::note

You can also use the [`SyntaxHighlight` component](/components/syntax-highlight) to render code blocks in TypeScript directly.

:::

## Inline Code

You can highlight inline code using either:

Regular backticks with language specification:

```md
`console.log("Hello World")`
```

Result: `console.log("Hello World")`

or with the tailing curly colon syntax:

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

## Default Supported Languages

Currently, Zudoku supports the following languages for syntax highlighting:

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

For a complete list of supported languages and their aliases, see the [Shiki Languages documentation](https://shiki.style/languages#bundled-languages).

## Configuration

You can configure syntax highlighting in your `zudoku.config.tsx`:

```tsx
import { defaultLanguages, type ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  // ...
  syntaxHighlighting: {
    languages: [...defaultLanguages, "powershell"], // Extend default languages
    themes: {
      light: "vitesse-light",
      dark: "vitesse-dark",
    },
  },
};
```

For a complete list of available themes and languages, see the list of [Shiki themes](https://shiki.style/themes) and [Shiki languages](https://shiki.style/languages).

:::info

Changes to the syntax highlighting configuration require a restart of Zudoku to take effect.

:::
