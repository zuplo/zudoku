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
`customComponents` option in the configuration.

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
