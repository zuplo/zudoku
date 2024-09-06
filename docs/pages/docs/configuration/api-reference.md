---
title: API Reference
sidebar_icon: square-library
---

The `apis` configuration setting in the [Zudoku Configuration](/docs/configuration/overview) file allows you to specify the OpenAPI document that you want to use to generate your API reference documentation.

There are multiple ways to reference an API file in the configuration including using a URL or a local file path. The OpenAPI document can be in either JSON or YAML format.

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

## Local File Reference

If you have a local OpenAPI document that you want to use, you import it into your Zudoku configuration file using a standard `import` statement.

**For JSON files:**

```ts
const config = {
  // ...
  apis: {
    type: "file",
    input: "./openapi.json",
    navigationId: "api",
  },
  // ...
};
```

**For YAML files:**

```ts
const config = {
  // ...
  apis: {
    type: "file",
    input: "./openapi.yaml",
    navigationId: "api",
  },
  // ...
};
```
