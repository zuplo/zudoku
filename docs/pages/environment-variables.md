---
title: Environment Variables
sidebar_icon: table
---

Zudoku is built on top of Vite and uses [their approach](https://vitejs.dev/guide/env-and-mode) for managing environment variables.

In Zudoku, environment variables that are prefixed with `PUBLIC_` are available in your application. These variables are inlined during the build process and can be accessed using `import.meta.env`.

When developing locally, you can create a `.env` file in the root of your project and add environment-specific variables.

Here is an example of a `.env.local` file:

```env
PUBLIC_PAGE_TITLE=My Page Title
```

You can access this variable in your application like this:

```ts
const pageTitle = import.meta.env.PUBLIC_PAGE_TITLE;
```

### IntelliSense for TypeScript

By default, Zudoku provides type definitions for import.meta.env in zudoku/client.d.ts. While you can define more custom env variables in .env.[mode] files, you may want to get TypeScript IntelliSense for user-defined env variables that are prefixed with PUBLIC\_.

To achieve this, you can create an zudoku-env.d.ts in src directory, then augment ImportMetaEnv like this:

```typescript
/// <reference types="zudoku/client" />

interface ImportMetaEnv {
  readonly PUBLIC_APP_TITLE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

:::warning{title="Imports will break type augmentation"}

If the ImportMetaEnv augmentation does not work, make sure you do not have any import statements in vite-env.d.ts. A helpful explanation can be found on [Stackoverflow](https://stackoverflow.com/a/51114250).

:::
