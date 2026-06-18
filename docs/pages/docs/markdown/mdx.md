---
title: MDX
sidebar_icon: notebook-pen
description:
  Learn how to use MDX in Zudoku to create rich documentation pages with markdown and custom React
  components.
---

Zudoku supports MDX files for creating rich content pages. MDX is a markdown format that allows you
to include JSX components in your markdown files.

## Getting Started

To use MDX in your documentation, simply create files with the `.mdx` extension instead of `.md`.
These files work exactly like regular markdown files but with all MDX features unlocked - you can
write normal markdown content and add JSX components whenever needed.

```
docs/
├── my-page.md      # Regular markdown
├── my-mdx-page.mdx # MDX with JSX support
```

## Custom Components

Zudoku supports the use of custom components in your MDX files. This allows you to create reusable
components that can be used across multiple pages.

You can create a custom component in your project and reference it in the
[Zudoku Configuration](./overview.md) file.

For example, create the `<MyCustomComponent />` component in a file called `MyCustomComponent.tsx`
in the `src` directory at the root of your project.

```tsx
export default function MyCustomComponent() {
  return <div>My Custom Component</div>;
}
```

In [Zudoku Configuration](./overview.md) you will need to import the component and add it to the
`mdx.components` option in the configuration.

```ts title=zudoku.config.ts
import MyCustomComponent from "./src/MyCustomComponent";

const config: ZudokuConfig = {
  // ...
  mdx: {
    components: {
      MyCustomComponent,
    },
  },
  // ...
};

export default config;
```

## Built-in Components

Zudoku ships with a set of components that are always available in any `.md` or `.mdx` file without
importing or registering them:

| Component                                                  | Description                                                                                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [`Alert`](../components/alert.mdx)                         | Inline alert message.                                                                                                              |
| [`Badge`](../components/badge.mdx)                         | Small label for status or metadata.                                                                                                |
| [`Button`](../components/button.mdx)                       | Button, optionally rendered as a link via `asChild`.                                                                               |
| [`Callout`](../components/callout.mdx)                     | Highlighted note. Also available as [admonitions](./admonitions.md) (`tip`, `info`, `note`, `caution`, `warning`, `danger`, etc.). |
| [`CodeTabs` / `CodeTabPanel`](../components/code-tabs.mdx) | Tabbed code blocks.                                                                                                                |
| [`Framed`](../components/framed.mdx)                       | Frames content such as screenshots and images.                                                                                     |
| [`Link`](../components/link.mdx)                           | Client-side router link for internal navigation.                                                                                   |
| [`Mermaid`](../components/mermaid.mdx)                     | Renders Mermaid diagrams.                                                                                                          |
| [`Stepper`](../components/stepper.mdx)                     | Numbered step-by-step instructions.                                                                                                |
| [`SyntaxHighlight`](../components/syntax-highlight.mdx)    | Syntax-highlighted code.                                                                                                           |

```mdx
<Badge variant="secondary">New</Badge>
```

## JSX in Headings

JSX components in headings render in both the sidebar navigation and table of contents:

```mdx
# My Page <Badge>New</Badge>
```

Built-in components like `<Badge>` work in headings out of the box. Custom components must be
registered via [`mdx.components`](#custom-components) to work in headings.
