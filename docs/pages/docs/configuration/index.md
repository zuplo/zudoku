---
title: Configuration
---

Zudoku uses a single file for configuration. It controls the structure, metadata, style, plugins, and routing for your documentation.

You can find the `zudoku.config.ts` file in the root directory of your project.

It will already be populated with some default options.

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
    //input: "https://rickandmorty.zuplo.io/openapi.json", // ...or, uncomment this line to see an example
    navigationId: "api",
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
};

export default config;
```

## What to configure first

We recommend the first option you setup is the `apis` configuration so your project knows which API to generate documentation for.

After all, you're here because you built your API using OpenAPI, right?

### OpenAPI URL

If your OpenAPI document is accessible elsewhere via URL you can use this configuration, changing the `input` value to the URL of your own OpenAPI document (you can use the Rick & Morty API document if you want to test and play around):

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

The OpenAPI document can be in either JSON or YAML format. Both are supported.

With this option configured, run:

```command
npm run dev
```

Then in your browser, navigate to http://localhost:9000/api to see your API documentation powered by Zudoku!

## Configuration options

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

Defines the links and headings for the top horizontal navigation that persists through every page on the site.

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

Defines the sidebar navigation including top level categories and their sub pages.

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
    "files": "/pages/**/*.mdx"
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

This covers everything you need to build a solid documentation site around your OpenAPI document.

If you want to include advanced options such as user authentication, API keys, search and other plugins, check out the Advanced Configuration page.
