---
title: Code Blocks
sidebar_icon: braces
---

Zudoku supports code blocks in Markdown using the [Prism.js](https://prismjs.com/) syntax highlighting library.

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

You can also use the [`SyntaxHighlight` component](/components/syntax-highlight) to render code blocks.

:::

You can add a title to code blocks by adding a title attribute after the backticks:

````md
```tsx title="hello.tsx"
console.log("Hello, World!");
```
````

```tsx title="hello.tsx"
console.log("Hello, World!");
```

## Supported Languages

Currently, Zudoku supports the following languages for syntax highlighting:

- Markup - `markup`, `html`, `xml`, `svg`, `mathml`, `ssml`, `atom`, `rss`
- Ruby - `ruby`, `rb`
- Bash - `bash`, `sh`, `shell`
- JSON - `json`, `webmanifest`
- Java - `java`
- C# - `csharp`, `cs`, `dotnet`
- Objective-C - `objectivec`, `objc`
- Markdown - `markdown`, `md`
- JavaScript - `javascript`, `js`, `jsx`
- TypeScript - `typescript`, `ts`, `tsx`

:::note

Language customization is coming soon! See [#86](https://github.com/zuplo/zudoku/issues/86)

:::
