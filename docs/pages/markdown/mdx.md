---
title: MDX
sidebar_icon: notebook-pen
---

Zudoku support MDX files for creating rich content pages. MDX is a markdown format that allows you to include JSX components in your markdown files.

## Custom Components

Zudoku supports the use of custom components in your MDX files. This allows you to create reusable components that can be used across multiple pages.

You can create a custom component in your project and reference it in the [Zudoku Configuration](./overview.md) file.

For example, create the `<MyCustomComponent />` component in a file called `MyCustomComponent.tsx` in the `src` directory at the root of your project.

```tsx
export default function MyCustomComponent() {
  return <div>My Custom Component</div>;
}
```

In [Zudoku Configuration](./overview.md) you will need to import the component and add it to the `customComponents` option in the configuration.

```ts
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
