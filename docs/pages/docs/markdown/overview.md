---
title: Markdown
navigation_icon: align-left
description:
  Comprehensive guide to using Markdown and MDX in Zudoku, including formatting, frontmatter, syntax
  highlighting, tables, lists, task lists, collapsible sections, and advanced documentation
  features.
---

Zudoku supports
[GitHub Flavored Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
(GFM) with additional features for creating rich documentation.

## Basic Formatting

### Headers

Use `#` to create headers. The number of `#` symbols determines the header level:

```md
# H1 Header

## H2 Header

### H3 Header

#### H4 Header

##### H5 Header

###### H6 Header
```

### Text Formatting

<!-- prettier-ignore -->
```mdx
**Bold text**
_Italic text_
~~Strikethrough text~~
`Inline code`
```

**Bold text**  
_Italic text_  
~~Strikethrough text~~  
`Inline code`

### Lists

**Unordered lists:**

```md
- Item 1
- Item 2
  - Nested item
  - Another nested item
```

**Ordered lists:**

```md
1. First item
2. Second item
   1. Nested item
   2. Another nested item
```

<details>
<summary>See list examples</summary>

**Unordered list:**

- Item 1
- Item 2
  - Nested item
  - Another nested item

**Ordered list:**

1. First item
2. Second item
   1. Nested item
   2. Another nested item

</details>

### Links and Images

```md
[Link text](https://example.com)

![Image alt text](image.jpg)
```

<details>
<summary>See link and image examples</summary>

[Link text](https://example.com)

![Image alt text](https://images.unsplash.com/photo-1588083066783-8828e623bad7?q=75&w=400&auto=format&fit=crop)

</details>

### Tables

```md
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

<details>
<summary>See table example</summary>

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

</details>

### Blockquotes

```md
> This is a blockquote
>
> It can span multiple lines
```

<details>
<summary>See blockquote example</summary>

> This is a blockquote
>
> It can span multiple lines

</details>

## Frontmatter

Frontmatter allows you to configure page metadata using YAML at the beginning of your markdown
files:

```md
---
title: My Page Title
description: Page description for SEO
navigation_icon: book
category: Getting Started
---

Your markdown content starts here...
```

Common frontmatter properties include `title`, `description`, `sidebar_icon`, and `category`. For a
complete list of supported properties, see the [Frontmatter documentation](./frontmatter).

## MDX Support

Zudoku supports [MDX](./mdx), allowing you to use JSX components within your markdown:

```mdx title=my-page.mdx
import MyCustomComponent from "./MyCustomComponent";

# Regular Markdown

This is regular markdown content.

<MyCustomComponent prop="value" />

You can mix markdown and JSX seamlessly.
```

MDX enables you to create interactive documentation with custom React components. Learn more in the
[MDX documentation](./mdx).

## Syntax Highlighting

Zudoku uses [Shiki](https://shiki.style/) for syntax highlighting in code blocks:

````md
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
```
````

**Advanced features:**

- Line highlighting: `{1,3-5}`
- Word highlighting: `/keyword/`
- Line numbers: `showLineNumbers`
- Titles: `title="filename.js"`

````
```tsx {4-5} /useState/ title="Counter.tsx" showLineNumbers
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```
````

<details>
<summary>See advanced features example</summary>

```tsx {4-5} /useState/ title="Counter.tsx" showLineNumbers
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

</details>

For complete syntax highlighting documentation, see [Code Blocks](./code-blocks).

## Additional Features

Zudoku also supports:

- [Admonitions](./admonitions) - Callout boxes for notes, warnings, and tips
- Task lists with checkboxes
- Emoji support :tada:
- Automatic link detection

### Task Lists

```md
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
```

<details>
<summary>See task list example</summary>

- [x] Completed task
- [ ] Incomplete task
- [ ] Another task

</details>

### Collapsible Sections

You can create collapsible content using HTML `<details>` and `<summary>` tags:

```html
<details>
  <summary>Click to expand</summary>

  This content is hidden by default and can be expanded by clicking the summary. You can include any
  markdown content here: - Lists - **Bold text** - Code blocks - Images
</details>
```

<details>
<summary>Click to expand</summary>

This content is hidden by default and can be expanded by clicking the summary.

You can include any markdown content here:

- Lists
- **Bold text**
- Code blocks
- Images

</details>
