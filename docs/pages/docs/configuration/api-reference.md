---
title: API Reference
sidebar_icon: square-library
description:
  Learn how to configure the `apis` setting in Zudoku to generate API reference documentation from
  OpenAPI files, including file and URL references, versioning, customization options, and OpenAPI
  extensions.
---

The `apis` configuration setting in the [Zudoku Configuration](./overview.md) file allows you to
specify the OpenAPI document that you want to use to generate your API reference documentation.

There are multiple ways to reference an API file in the configuration including using a URL or a
local file path. The OpenAPI document can be in either JSON or YAML format.

## File Reference

You can reference a local OpenAPI document by setting the `type` to `file` and providing the path to
the file.

```ts title=zudoku.config.ts
const config = {
  // ...
  apis: {
    type: "file",
    input: "./openapi.json", // Supports JSON and YAML files (ex. openapi.yaml)
    path: "/api",
  },
  // ...
};
```

## URL Reference

:::danger{title="Recommendation"}

We strongly recommend using `type: "file"` for your OpenAPI schemas. When using URL based
references, all schema processing occurs at runtime in the browser. This can cause noticeable
performance issues with large OpenAPI documents and some features may not be fully supported due to
the added complexity of runtime processing.

:::

If your OpenAPI document is accessible elsewhere via URL you can use this configuration, changing
the `input` value to the URL of your own OpenAPI document (you can use the Rick & Morty API document
if you want to test and play around):

```ts title=zudoku.config.ts
const config = {
  // ...
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    path: "/api",
  },
  // ...
};
```

:::caution{title="CORS Policy"}

If you are using a URL to reference your OpenAPI document, you may need to ensure that the server
hosting the document has the correct CORS policy in place to allow the Zudoku site to access it.

:::

## Versioning

### File-based Versioning

When using `type: "file"`, you can provide an array of file paths to create versioned API
documentation. Version metadata is automatically extracted from each OpenAPI schema at build time:

```ts title=zudoku.config.ts
const config = {
  apis: {
    type: "file",
    input: [
      // Order of the array determines the order of the versions
      "./openapi-v2.json",
      "./openapi-v1.json",
    ],
    path: "/api",
  },
};
```

### URL-based Versioning

When using `type: "url"`, you can provide an array of version configurations. Since URL-based
schemas cannot be processed at build time, you must explicitly specify the version identifier and
optional label:

```ts title=zudoku.config.ts
const config = {
  apis: {
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
  },
};
```

Each URL version object requires:

- `path`: Version identifier used in the URL path (e.g., `/api/v2`)
- `input`: URL to the OpenAPI document
- `label`: Optional display name for the version selector (defaults to `path` if not provided)

## Options

The `options` field allows you to customize the API reference behavior:

```ts title=zudoku.config.ts
const config = {
  apis: {
    type: "file",
    input: "./openapi.json",
    path: "/api",
    options: {
      examplesLanguage: "shell", // Default language for code examples
      supportedLanguages: [
        { label: "cURL", language: "shell" },
        { label: "JavaScript", language: "javascript" },
      ],
      disablePlayground: false, // Disable the interactive API playground
      disableSidecar: false, // Disable the sidecar completely
      showVersionSelect: "if-available", // Control version selector visibility
      expandAllTags: true, // Control initial expanded state of tag categories
      expandApiInformation: false, // Control if API information section is expanded
      schemaDownload: { enabled: true }, // Enable schema download button
    },
  },
};
```

Available options:

- `examplesLanguage`: Set default language for code examples
- `supportedLanguages`: Array of language options for code examples. Each option has `label` (display name) and `language` (code identifier)
- `disablePlayground`: Disable the interactive API playground globally
- `disableSidecar`: Disable the sidecar panel completely
- `showVersionSelect`: Control version selector visibility
  - `"if-available"`: Show version selector only when multiple versions exist (default)
  - `"always"`: Always show version selector (disabled if only one version)
  - `"hide"`: Never show version selector
- `expandAllTags`: Control initial expanded state of tag categories (default: `true`)
- `expandApiInformation`: Control if the API information section is expanded by default
- `schemaDownload`: Enable schema download functionality with `{ enabled: boolean }`. When enabled,
  displays a button allowing users to download the OpenAPI schema, copy it to clipboard, open in a
  new tab, or use it with AI tools like Claude and ChatGPT
- `transformExamples`: Function to transform request/response examples before rendering. See
  [Transforming Examples](../guides/transforming-examples.md) for detailed usage
- `generateCodeSnippet`: Function to generate custom code snippets for the API playground. See
  [Advanced Configuration](#advanced-configuration) below

## Default Options

Instead of setting options for each API individually, you can use `defaults.apis` to set global
defaults that apply to all APIs:

```ts title=zudoku.config.ts
const config = {
  defaults: {
    apis: {
      examplesLanguage: "shell", // Default language for code examples
      disablePlayground: false, // Disable the interactive API playground
      disableSidecar: false, // Disable the sidecar completely
      showVersionSelect: "if-available", // Control version selector visibility
      expandAllTags: false, // Control initial expanded state of tag categories
      expandApiInformation: false, // Control if API information section is expanded
      schemaDownload: { enabled: true }, // Enable schema download button
    },
  },
  apis: {
    type: "file",
    input: "./openapi.json",
    path: "/api",
  },
};
```

Individual API options will override these defaults when specified.

## Advanced Configuration

### Custom Code Snippets

Use `generateCodeSnippet` to generate custom code snippets instead of the default HTTP examples. This
is useful when you want to show SDK usage or language-specific implementations.

```tsx title=zudoku.config.tsx
const config: ZudokuConfig = {
  apis: {
    type: "file",
    input: "./openapi.json",
    path: "/api",
    options: {
      supportedLanguages: [
        { value: "js", label: "JavaScript" },
        { value: "python", label: "Python" },
      ],
      generateCodeSnippet: ({ selectedLang, selectedServer, operation, example }) => {
        if (operation.operationId === "createUser") {
          if (selectedLang === "js") {
            return `
import { Client } from "@mycompany/sdk";

const client = new Client({ baseUrl: "${selectedServer}" });
const user = await client.createUser(${JSON.stringify(example, null, 2)});
            `.trim();
          }
          if (selectedLang === "python") {
            return `
from mycompany import Client

client = Client(base_url="${selectedServer}")
user = client.create_user(${JSON.stringify(example)})
            `.trim();
          }
        }
        // Return false to use default snippet generation
        return false;
      },
    },
  },
};
```

The function receives:

- `selectedLang`: Currently selected language from `supportedLanguages`
- `selectedServer`: Currently selected server URL
- `operation`: The OpenAPI operation object
- `example`: The current request body example

Return a string with the custom snippet, or `false` to fall back to default generation.

## Extensions

Zudoku supports OpenAPI extensions (properties starting with `x-`) to customize behavior at
different levels of your API documentation.

### Operations

- `x-zudoku-playground-enabled`: Control playground visibility for an operation (default: `true`)
- `x-explorer-enabled`: Alias for `x-zudoku-playground-enabled` for compatibility Example:

```json
{
  "paths": {
    "/users": {
      "get": {
        "summary": "Get users",
        "x-zudoku-playground-enabled": false // Disable playground for this operation
      }
    }
  }
}
```

### Tags

Extensions that can be applied to tag categories:

- `x-zudoku-collapsed`: Control initial collapsed state of a tag category (default: `true`)
- `x-zudoku-collapsible`: Control if a tag category can be collapsed (default: `true`)

Example:

```json
{
  "tags": [
    {
      "name": "Users",
      "x-zudoku-collapsed": false
    }
  ]
}
```

### Tag Groups

Use `x-tagGroups` at the root of your OpenAPI document to group tags together in the navigation:

```yaml
x-tagGroups:
  - name: Shipment
    tags:
      - Packages
      - Parcels
      - Letters
```

## Metadata

Your API reference page metadata is sourced directly from your OpenAPI spec. The
[`info`](https://spec.openapis.org/oas/v3.1.0#info-object) object is used set the corresponding tags
in the page's `head`.

| Metadata Property | OpenAPI Property | Comment                                                                                                                                        |
| ----------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| title             | `info.title`     | If `metadata.title` is set as a template string (ex. `%s - My Company`) it will be used                                                        |
| description       | `info.summary`   | `info.summary` is preferred as it is shorter and plaintext-only, but Zudoku will fall back to the `info.description` if no summary is provided |
