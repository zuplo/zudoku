---
title: Using the OpenAPI Plugin Directly
sidebar_label: OpenAPI as a Plugin
sidebar_icon: unplug
description:
  Learn how to register the OpenAPI plugin directly in the plugins array of your Zudoku
  configuration for full control over your API reference, instead of using the apis setting.
---

The [`apis` configuration setting](../configuration/api-reference.md) is the recommended way to add
API reference documentation to your site. Under the hood, it creates an instance of the OpenAPI
plugin for each configured API. For advanced use cases you can skip the `apis` setting and register
the plugin yourself using the `plugins` array.

Using the plugin directly is useful when you want to:

- Load a schema from a URL or a raw string at runtime, without any build-time processing
- Embed an API reference in a custom setup where the `apis` setting is not available
- Have full, explicit control over the plugin instance and its options

:::caution{title="File schemas require the `apis` setting"}

The `type: "file"` input relies on build-time schema processing (bundling, OpenAPI 3.0 → 3.1
upgrades, and [schema processors](./processors.mdx)) that only runs for APIs configured through the
`apis` setting. When using the plugin directly, use `type: "url"` or `type: "raw"` — both are
processed at runtime in the browser.

:::

## Basic Usage

Import `openApiPlugin` from `zudoku/plugins/openapi` and add it to the `plugins` array:

```tsx title=zudoku.config.tsx
import type { ZudokuConfig } from "zudoku";
import { openApiPlugin } from "zudoku/plugins/openapi";

const config: ZudokuConfig = {
  // ...
  navigation: [
    {
      type: "link",
      label: "API Reference",
      to: "/api",
    },
  ],
  plugins: [
    openApiPlugin({
      type: "url",
      input: "https://rickandmorty.zuplo.io/openapi.json",
      path: "/api",
    }),
  ],
};

export default config;
```

The plugin registers all routes for the API reference under the given `path` and provides the
sidebar navigation for it, built from the tags and operations in your schema. Add a navigation
`link` pointing to the `path` (as shown above) so users can reach the API reference from the top
navigation.

## Raw Schemas

With `type: "raw"` you can pass the schema contents directly as a string. Both JSON and YAML are
supported:

```tsx title=zudoku.config.tsx
import { openApiPlugin } from "zudoku/plugins/openapi";
import mySchema from "./openapi.json";

const config: ZudokuConfig = {
  // ...
  plugins: [
    openApiPlugin({
      type: "raw",
      input: JSON.stringify(mySchema),
      path: "/api",
    }),
  ],
};
```

Unlike `type: "file"` in the `apis` setting, the raw schema is processed at runtime in the browser,
so build-time [schema processors](./processors.mdx) do not run on it.

## Versions

For multiple versions, pass an array of version objects as the `input`, the same way as with
[URL-based versioning](../configuration/api-reference.md#url-based-versioning) in the `apis`
setting:

```tsx title=zudoku.config.tsx
openApiPlugin({
  type: "url",
  input: [
    {
      path: "v2",
      label: "Version 2.0",
      input: "https://api.example.com/openapi-v2.json",
    },
    {
      path: "v1",
      label: "Version 1.0",
      input: "https://api.example.com/openapi-v1.json",
    },
  ],
  path: "/api",
});
```

## Options

The plugin accepts the same `options` as the `apis` setting. See the
[API Reference options](../configuration/api-reference.md#options) for the full list:

```tsx title=zudoku.config.tsx
openApiPlugin({
  type: "url",
  input: "https://api.example.com/openapi.json",
  path: "/api",
  options: {
    examplesLanguage: "shell",
    disablePlayground: false,
    expandAllTags: true,
    showInfoPage: true,
  },
});
```

Note that some defaults differ when using the plugin directly, since the
[`defaults.apis`](../configuration/api-reference.md#default-options) setting is **not** applied to
plugin instances you create yourself:

- `disableSecurity` defaults to `false` (security schemes are shown), while the `apis` setting
  defaults it to `true`
- `expandAllTags` defaults to `false` (tag categories start collapsed), while the `apis` setting
  defaults it to `true` for file-based schemas

Set these options explicitly if you rely on a specific behavior.

## Additional Properties

Besides `options`, the plugin accepts a few top-level properties:

- `server`: A server URL the browser should preconnect to, used to speed up the first request made
  from the API playground
- `skipPreload`: By default, URL inputs are preloaded via a `<link rel="preload">` tag in the head.
  Set this to `true` to disable the preload

```tsx title=zudoku.config.tsx
openApiPlugin({
  type: "url",
  input: "https://api.example.com/openapi.json",
  path: "/api",
  server: "https://api.example.com",
  skipPreload: true,
});
```

## MDX Components

The plugin registers the `OpenPlaygroundButton` MDX component, which lets you open the
[API playground](/docs/components/playground) from any MDX page:

```mdx
<OpenPlaygroundButton server="https://api.example.com" method="get" url="/users" />
```

## Multiple Instances

You can register the plugin multiple times to document several APIs, each under its own path:

```tsx title=zudoku.config.tsx
const config: ZudokuConfig = {
  // ...
  plugins: [
    openApiPlugin({
      type: "url",
      input: "https://api.example.com/shipments/openapi.json",
      path: "/api/shipments",
    }),
    openApiPlugin({
      type: "url",
      input: "https://api.example.com/tracking/openapi.json",
      path: "/api/tracking",
    }),
  ],
};
```

You can also mix both approaches: use the `apis` setting for file-based schemas and add plugin
instances for runtime-loaded ones.
