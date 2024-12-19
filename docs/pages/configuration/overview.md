---
title: Configuration
---

Zudoku uses a single file for configuration. It controls the structure, metadata, style, plugins, and routing for your documentation.

You can find the file in the root directory of your project. It will be start with `zudoku.config`. The file can be in either JavaScript or TypeScript format and use a `.js`, `.mjs`, `.jsx`, `.ts`, or `.tsx` file extension.

When you create a project with `create-zudoku-app`, a default configuration file is generated for you. This file is a good starting point and can be customized to suit your needs.

## Example

Below is real example that is used to configure the default Zudoku site that `create-zudoku-app` will generate. You can edit this configuration to suit your own needs.

```typescript
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  topNavigation: [
    { id: "documentation", label: "Documentation" },
    { id: "api", label: "API Reference" },
  ],
  sidebar: {
    documentation: [
      {
        type: "category",
        label: "Overview",
        items: ["example", "other-example"],
      },
    ],
  },
  redirects: [{ from: "/", to: "/documentation" }],
  apis: {
    type: "url",
    input: "https://api.example.com/openapi.json", // Enter the URL for your OpenAPI document
    // input: "https://rickandmorty.zuplo.io/openapi.json", // ...or, uncomment this line to see an example
    navigationId: "api",
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
};

export default config;
```

## Multiple Files

The configuration file is a standard JavaScript or TypeScript file, so you can split it into multiple files if you prefer. This can be useful if you have a large configuration or want to keep your code organized.

For example, if you wanted to move your sidebar configuration to a separate file, you could create a new file called `sidebar.ts` and export the sidebar configuration from there.

```ts
// sidebar.ts
import type { Sidebar } from "zudoku";

export const sidebar: Record<string, Sidebar> = {
  documentation: [
    {
      type: "category",
      label: "Overview",
      items: ["example", "other-example"],
    },
  ],
};
```

Then you can import the sidebar configuration into your main configuration file.

```ts
// zudoku.config.ts
import type { ZudokuConfig } from "zudoku";
import { sidebar } from "./sidebar";

const config = {
  // ...
  sidebar,
  // ...
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
    "navigationId": "api"
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
  "page": {
    "pageTitle": "Our Documentation",
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

### `topNavigation`

Defines the links and headings for the top horizontal navigation that persists through every page on the site. For full details on the options available, see the [Navigation](./navigation.mdx) page.

_Note: `topNavigation` will only display if there is more than one item in the navigation_

**Example:**

```json
{
  // ...
  "topNavigation": [
    { "id": "documentation", "label": "Documentation" },
    { "id": "api", "label": "API Reference" }
  ]
  // ...
}
```

### `sidebar`

Defines the sidebar navigation including top level categories and their sub pages. For full details on the options available, see the [Navigation](./navigation.mdx) page.

The example below uses a key of `documentation` which can be referenced as an `id` in `topNavigation`.

**Example:**

```json
{
  // ...
  "sidebar": {
    "documentation": [
      {
        "type": "category",
        "label": "Zudoku",
        "items": ["introduction"]
      },
      {
        "type": "category",
        "label": "Getting started",
        "items": ["getting-started", "installation", "configuration"]
      }
    ]
  }
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
