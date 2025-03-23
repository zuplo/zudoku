---
title: API Reference
sidebar_icon: square-library
---

The `apis` configuration setting in the [Zudoku Configuration](./overview.md) file allows you to specify the OpenAPI document that you want to use to generate your API reference documentation.

There are multiple ways to reference an API file in the configuration including using a URL or a local file path. The OpenAPI document can be in either JSON or YAML format.

## File Reference

You can reference a local OpenAPI document by setting the `type` to `file` and providing the path to the file.

```ts
const config = {
  // ...
  apis: {
    type: "file",
    input: "./openapi.json", // Supports JSON and YAML files (ex. openapi.yaml)
    navigationId: "api",
  },
  // ...
};
```

## URL Reference

If your OpenAPI document is accessible elsewhere via URL you can use this configuration, changing the `input` value to the URL of your own OpenAPI document (you can use the Rick & Morty API document if you want to test and play around):

```js
const config = {
  // ...
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    navigationId: "api",
  },
  // ...
};
```

:::caution{title="CORS Policy"}

If you are using a URL to reference your OpenAPI document, you may need to ensure that the server hosting the document has the correct CORS policy in place to allow the Zudoku site to access it.

:::

## Versioning

When using `type: "file"`, you can provide an array of OpenAPI documents to create versioned API documentation:

```ts
const config = {
  apis: {
    type: "file",
    input: [
      // Order of the array determines the order of the versions
      "./openapi-v2.json",
      "./openapi-v1.json",
    ],
    navigationId: "api",
  },
};
```

## Options

The `options` field allows you to customize the API reference behavior:

```ts
const config = {
  apis: {
    type: "file",
    input: "./openapi.json",
    navigationId: "api",
    options: {
      examplesLanguage: "shell", // Default language for code examples
      disablePlayground: false, // Disable the interactive API playground
      showVersionSelect: "if-available", // Control version selector visibility
    },
  },
};
```

Available options:

- `examplesLanguage`: Set default language for code examples
- `disablePlayground`: Disable the interactive API playground globally
- `showVersionSelect`: Control version selector visibility
  - `"if-available"`: Show version selector only when multiple versions exist (default)
  - `"always"`: Always show version selector (disabled if only one version)
  - `"hide"`: Never show version selector

## Default Options

Instead of setting options for each API individually, you can use `defaults.apis` to set global defaults that apply to all APIs:

```ts
const config = {
  defaults: {
    apis: {
      examplesLanguage: "shell", // Default language for code examples
      disablePlayground: false, // Disable the interactive API playground
      showVersionSelect: "if-available", // Control version selector visibility
    },
  },
  apis: {
    type: "file",
    input: "./openapi.json",
    navigationId: "api",
  },
};
```

Individual API options will override these defaults when specified.

## Extensions

Zudoku supports OpenAPI extensions (properties starting with `x-`) to customize behavior at different levels of your API documentation.

### Operations

- `x-zudoku-playground-enabled`: Control playground visibility for an operation (default: `true`)
- `x-explorer-enabled`: Alias for `x-zudoku-playground-enabled` for compatibility Example:

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

## Metadata

Your API reference page metadata is sourced directly from your OpenAPI spec. The [`info`](https://spec.openapis.org/oas/v3.1.0#info-object) object is used set the corresponding tags in the page's `head`.

| Metadata Property | OpenAPI Property | Comment                                                                                                                                        |
| ----------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| title             | `info.title`     | If `metadata.title` is set as a template string (ex. `%s - My Company`) it will be used                                                        |
| description       | `info.summary`   | `info.summary` is preferred as it is shorter and plaintext-only, but Zudoku will fall back to the `info.description` if no summary is provided |
