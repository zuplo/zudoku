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

### Additional Languages

If you need to add support for additional languages, you can do so by specifying the language name in your configuration file. You can find the list of supported languages in the [Prism.js documentation](https://prismjs.com/#supported-languages).

:::note{title="Note"}

Each additional language has to be a valid Prism component name. For example, Prism would map the language cs to csharp, but only prism-csharp.js exists as a component, so you need to use additionalLanguages: ['csharp']. You can look into node_modules/prismjs/components to find all components (languages) available.

:::

```typescript
import { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  theme: {
    code: {
      additionalLanguages: ["python", "go", "rust"],
    },
  },
};
```
