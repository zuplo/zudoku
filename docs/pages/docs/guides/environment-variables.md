---
title: Environment Variables
sidebar_icon: table
---

Zudoku is built on top of Vite and uses [their approach](https://vitejs.dev/guide/env-and-mode) for
managing environment variables.

Zudoku exposes environment variables under the `import.meta.env` object as strings automatically.

To prevent accidentally leaking environment variables to the client, only variables prefixed with
`ZUDOKU_PUBLIC_` are exposed to your Zudoku-processed code.

:::warning{title="Security Notice"}

Environment variables prefixed with `ZUDOKU_PUBLIC_` will be exposed to the client-side code and
visible in the browser. Never use this prefix for sensitive information like API keys, passwords, or
other secrets.

:::

## Local Env Files

When developing locally, you can create a `.env` file in the root of your project and add
environment-specific variables. See the
[Vite documentation](https://vitejs.dev/guide/env-and-mode.html#env-files) for more information on
supported files.

Here is an example of a `.env.local` file:

```sh
ZUDOKU_PUBLIC_PAGE_TITLE=My Page Title
```

You can access this variable in your application like this:

```ts
const title = import.meta.env.ZUDOKU_PUBLIC_PAGE_TITLE;
```

## Configuration Files

Environment variables can also be used in your configuration files. When referencing environment
variables in your configuration files, you can use `process.env` directly.

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

If you need to access environment variables inside a custom react component, you can access them via
`import.meta.env`. Public environment variables are inlined during the build process.

```tsx
import React from "react";

export const MyComponent = () => {
  return <h1>{import.meta.env.ZUDOKU_PUBLIC_PAGE_TITLE}</h1>;
};
```

## IntelliSense for TypeScript

By default, Zudoku provides type definitions for `import.meta.env` in `zudoku/client.d.ts`. While
you can define more custom env variables in `.env.[mode]` files, you may want to get TypeScript
IntelliSense for user-defined env variables that are prefixed with `ZUDOKU_PUBLIC_`.

To achieve this, you can create a `zudoku-env.d.ts` in the src directory, then augment
`ImportMetaEnv` like this:

```typescript
/// <reference types="zudoku/client" />

interface ImportMetaEnv {
  readonly ZUDOKU_PUBLIC_APP_TITLE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

:::warning{title="Imports will break type augmentation"}

If the `ImportMetaEnv` augmentation does not work, make sure you do not have any import statements
in `vite-env.d.ts`. A helpful explanation can be found on
[this StackOverflow reply](https://stackoverflow.com/a/51114250).

:::
