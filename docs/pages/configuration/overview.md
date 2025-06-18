---
title: Configuration File
sidebar_icon: file-json-2
---

Zudoku uses a single file for configuration. It controls the structure, metadata, style, plugins, and routing for your documentation.

You can find the file in the root directory of your project. It will start with `zudoku.config`. The file can be in either JavaScript or TypeScript format and use a `.js`, `.mjs`, `.jsx`, `.ts`, or `.tsx` file extension:

- `zudoku.config.ts`
- `zudoku.config.tsx`
- `zudoku.config.js`
- `zudoku.config.jsx`
- `zudoku.config.mjs`

When you create a project, a default configuration file is generated for you. This file is a good starting point and can be customized to suit your needs.

:::note{title="Security Consideration"}

The Zudoku configuration file runs on both client and server at runtime. Avoid including secrets directly in your config as they may be exposed to the client.

:::

## Example

Below is an example of the default Zudoku configuration. You can edit this configuration to suit your own needs.

```typescript
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  navigation: [
    {
      type: "category",
      label: "Documentation",
      items: ["introduction", "example"],
    },
    { type: "link", to: "api", label: "API Reference" },
  ],
  redirects: [{ from: "/", to: "/docs/introduction" }],
  apis: {
    type: "file",
    input: "./apis/openapi.yaml",
    path: "api",
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
};

export default config;
```

## Configuration options

### `apis`

There are multiple options for referencing your OpenAPI document. The example below uses a URL to an OpenAPI document, but you can also use a local file path. For full details on the options available, see the [API Reference](./api-reference.md).

```json
{
  // ...
  "apis": {
    "type": "url",
    "input": "https://rickandmorty.zuplo.io/openapi.json",
    "path": "api"
  }
  // ...
}
```

### `page`

Controls global page attributes across the site, including logos and the site title.

**Example:**

```json
{
  // ...
  "site": {
    "title": "Our Documentation",
    "logo": {
      "src": {
        "light": "/logos/zudoku-light.svg",
        "dark": "/logos/zudoku-dark.svg"
      },
      "width": "99px"
    }
  }
  // ...
}
```

### `navigation`

Defines navigation for both the top bar and the sidebar. Items can be categories, links or custom pages.

```json
{
  // ...
  "navigation": [
    { "type": "category", "label": "Docs", "items": ["introduction"] },
    { "type": "link", "to": "api", "label": "API Reference" }
  ]
  // ...
}
```

### `theme`

Allows you to control the dark and light themes that persist across each MDX page, and the API reference.

You can customize your theme as much as you want using [ShadCDN UI theme variables](https://ui.shadcn.com/docs/theming#list-of-variables). In the example below only the `primary` and `primaryForeground` variables are used but you can add any additional variables from ShadCDN UI that you would like to change.

**Tip**: Use the [ShadCDN UI Theme Generator](https://gradient.page/tools/shadcn-ui-theme-generator) to create a great looking theme based off your primary color.

**Example:**

```json
{
  // ...
  "theme": {
    "light": {
      "primary": "316 100% 50%",
      "primaryForeground": "360 100% 100%"
    },
    "dark": {
      "primary": "316 100% 50%",
      "primaryForeground": "360 100% 100%"
    }
  }
  // ...
}
```

### `metadata`

Controls the site metadata for your documentation. All possible options are outlined in the example below.

**Example:**

```json
{
  // ...
  "metadata": {
    "title": "Example Website Title",
    "description": "This is an example description for the website.",
    "logo": "https://example.com/logo.png",
    "favicon": "https://example.com/favicon.ico",
    "generator": "Website Generator 1.0",
    "applicationName": "Example App",
    "referrer": "no-referrer",
    "keywords": ["example", "website", "metadata", "SEO"],
    "authors": ["John Doe", "Jane Smith"],
    "creator": "John Doe",
    "publisher": "Example Publisher Inc."
  }
  // ...
}
```

### `docs`

Configures where your non API reference documentation can be found in your folder structure. The default is shown in the example below and you don't need to change it unless you want a different structure in place, or to have it match an existing structure that you already have.

**Example:**

```json
{
  // ...
  "docs": {
    "files": "/pages/**/*.{md,mdx}"
  }
  // ...
}
```

### `sitemap`

Controls the sitemap for your documentation. All possible options are outlined in the example below.

```json
{
  // ...
  "sitemap": {
    // The base url for your site
    // Required
    "siteUrl": "https://example.com",
    // The change frequency for the pages
    // Defaults to daily
    "changefreq": "daily",
    // The priority for the pages
    // Defaults to 0.7
    "priority": 0.7,
    // The output directory for the sitemap
    // Defaults to undefined
    "outDir": "sitemaps/",
    // Whether to include the last modified date
    // Defaults to true
    "autoLastmod": true,
    // The pages to exclude from the sitemap
    // Can also be a function that returns an array of paths
    // () => Promise<string[]>
    "exclude": ["/404", "/private/page"]
  }
  // ...
}
```

### `redirects`

Implements any page redirects you want to use. This gives you control over the resource names in the URL.

**Example:**

```json
{
  // ...
  "redirects": [
    { "from": "/", "to": "/documentation/introduction" },
    { "from": "/documentation", "to": "/documentation/introduction" }
  ]
  // ...
}
```

### `port`

The port on which the development server will run. Defaults to `3000`. This option can also be passed to the CLI as `--port' (which takes precedence).

```json
{
  "port": 9001
}
```

If the port is already in use, the next available port will be used.

### `basePath`

Sets the base path for your documentation site. This is useful when you want to host your documentation under a specific path.

```ts
{
  basePath: "/docs",
  // A page defined as `/intro` would result in: https://example.com/docs/intro
}
```

### `canonicalUrlOrigin`

Sets the canonical [origin URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/origin) for your documentation site. This is used for SEO purposes and helps search engines understand the preferred version of a page.

```ts
{
  basePath: '/docs',
  canonicalUrlOrigin: "https://example.com",
  // visiting the page `/intro` would result in:
  // https://example.com/docs/intro
}
```

This is the resulting HTML that will be added to the `<head>` of your pages:

```html
<link rel="canonical" href="https://example.com/docs/intro" />
```

### `cdnUrl`

Configures the CDN URL for your documentation site's assets. You can provide either a string for a single CDN URL or an object to specify different URLs for base and media assets.

```ts
// Single CDN URL
{
  cdnUrl: "https://cdn.example.com"
}

// Separate URLs for base and media assets
{
  cdnUrl: {
    base: "https://cdn.example.com",
    media: "https://media.example.com"
  }
}
```

### `https`

Enables HTTPS for the dev server. `key` and `cert` are required and `ca` is optional.

```json
{
  "https": {
    "key": "/path/to/key.pem",
    "cert": "/path/to/cert.pem",
    "ca": "/path/to/ca.pem"
  }
}
```

### `enableStatusPages`

Enables static generation of status pages for your site. This results in several files (404.html, 500.html, etc.) being generated in the `dist` directory. This is useful as many hosting providers will serve these files automatically when a user visits a non-existent page or encounters an error.

This option is enabled by default, but you can disable it if you don't need these pages.

```ts
{
  enableStatusPages: false;
}
```

## Multiple Files

The configuration file is a standard JavaScript or TypeScript file, so you can split it into multiple files if you prefer. This can be useful if you have a large configuration or want to keep your code organized.

For example, if you wanted to move your navigation configuration to a separate file, you could create a new file called `navigation.ts` and export the navigation configuration from there.

```ts
// navigation.ts
import type { Navigation } from "zudoku";

export const navigation: Navigation = [
  {
    type: "category",
    label: "Documentation",
    items: ["example", "other-example"],
  },
];
```

Then you can import the navigation configuration into your main configuration file.

```ts title=zudoku.config.ts
// zudoku.config.ts
import type { ZudokuConfig } from "zudoku";
import { navigation } from "./navigation";

const config = {
  // ...
  navigation,
  // ...
};

export default config;
```
