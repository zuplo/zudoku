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

### Supported Languages

Currently, Zudoku supports the following languages for syntax highlighting:

- Markup - `markup`, `html`, `xml`, `svg`, `mathml`, `ssml`, `atom`, `rss`
- Ruby - `ruby`, `rb`
- Bash - `bash`, `sh`, `shell`
- PHP - `php`
- JSON - `json`, `webmanifest`
- Java - `java`
- C# - `csharp`, `cs`, `dotnet`
- Objective-C - `objectivec`, `objc`
- Markdown - `markdown`, `md`
- JavaScript - `javascript`, `js`
- TypeScript - `typescript`, `ts`

:::note

Language customization is coming soon! See [#86](https://github.com/zuplo/zudoku/issues/86)

:::
