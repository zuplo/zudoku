---
title: Environment Variables
sidebar_icon: table
---

Zudoku is built on top of Vite and uses [their approach](https://vitejs.dev/guide/env-and-mode) for managing environment variables.

In Zudoku, environment variables that are prefixed with `ZUDOKU_PUBLIC_` are available in your application.

## Local Env Files

When developing locally, you can create a `.env` file in the root of your project and add environment-specific variables. See the [Vite documentation](https://vitejs.dev/guide/env-and-mode.html#env-files) for more information on supported files.

Here is an example of a `.env.local` file:

```env
PUBLIC_PAGE_TITLE=My Page Title
```

You can access this variable in your application like this:

```ts
const pageTitle = import.meta.env.PUBLIC_PAGE_TITLE;
```

## Configuration Files

Environment variables can also be used in your configuration files. When referencing environment variables in your configuration files, you can use `process.env` directly.

```ts
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  authentication: {
    type: "auth0",
    clientId: process.env.ZUDOKU_PUBLIC_AUTH_CLIENT_ID,
    domain: process.env.ZUDOKU_PUBLIC_AUTH_DOMAIN,
  },
};
```

## React Components

If you need to access environment variables inside a custom react component, you can access them via `import.meta.env`. Public environment variables are inlined during the build process.

```tsx
import React from "react";

export const MyComponent = () => {
  return <h1>{import.meta.env.PUBLIC_PAGE_TITLE}</h1>;
};
```

## IntelliSense for TypeScript

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
