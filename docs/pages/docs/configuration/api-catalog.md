---
title: API Catalog
sidebar_icon: book-open
---

If you're dealing with multiple APIs and multiple OpenAPI files, the API Catalog comes in handy. It
creates an overview of all your APIs and lets you organize them into categories and tags.

## Enable API Catalog

To enable the API Catalog, add a `catalogs` object to your Zudoku configuration file.

```ts title=zudoku.config.ts
const config = {
  // ...
  catalogs: {
    path: "/catalog",
    label: "API Catalog",
  },
  // ...
};
```

You can then add your APIs to the catalog by adding the `categories` property to your API
configuration.

:::caution{title="Important: API paths must be nested under the catalog path"}

APIs that appear in the catalog **must** have their `path` prefixed with the catalog path. For
example, if your catalog is at `/catalog`, an API path must start with `/catalog/` (e.g.,
`/catalog/api-users`). APIs with paths outside the catalog path will not appear in the catalog.

:::

```ts title=zudoku.config.ts
const config = {
  catalogs: {
    path: "/catalog",
    label: "API Catalog",
  },
  apis: [
    {
      type: "file",
      input: "./operational.json",
      path: "/catalog/api-operational", // Must be under /catalog/
      categories: [{ label: "General", tags: ["Operational"] }],
    },
    {
      type: "file",
      input: "./enduser.json",
      path: "/catalog/api-enduser", // Must be under /catalog/
      categories: [{ label: "General", tags: ["End-User"] }],
    },
    {
      type: "file",
      input: "./openapi.json",
      path: "/catalog/api-auth", // Must be under /catalog/
      categories: [{ label: "Other", tags: ["Authentication"] }],
    },
  ],
};
```

To add the catalog to your navigation, use a link item:

```ts title=zudoku.config.ts
const config = {
  navigation: [
    {
      type: "link",
      label: "API Catalog",
      to: "/catalog",
      icon: "square-library",
    },
  ],
  // ... catalogs and apis config
};
```

## Advanced Configuration

### Select APIs to show in the catalog

You can select which APIs are shown in the catalog by using the `items` property. The `items`
property is an array of navigation IDs of the APIs you want to show in the catalog.

```ts title=zudoku.config.ts
const config = {
  catalogs: {
    path: "/catalog",
    label: "API Catalog",
    // Only show the operational API in the catalog
    items: ["api-operational"],
  },
  apis: [
    {
      type: "file",
      input: "./operational.json",
      path: "/catalog/api-operational",
      categories: [{ label: "General", tags: ["Operational"] }],
    },
    {
      type: "file",
      input: "./enduser.json",
      path: "/catalog/api-enduser",
      categories: [{ label: "General", tags: ["End-User"] }],
    },
  ],
};
```

### Filtering catalog items

You can filter which APIs are shown in the catalog by using the `filterItems` property. The function
receives the items and context as arguments.

```ts title=zudoku.config.ts
const config = {
  catalogs: {
    path: "/catalog",
    label: "API Catalog",
    filterItems: (items, { auth }) => {
      return items.filter((item) => item.tags.includes("public"));
    },
  },
};
```

## Standalone APIs (without catalog)

APIs that are **not** part of a catalog can use any path and will appear as standalone API reference
pages. These APIs don't need `categories` and their paths don't need to be nested under a catalog.

```ts title=zudoku.config.ts
const config = {
  apis: [
    {
      type: "file",
      input: "./openapi.json",
      path: "/api", // standalone, not under a catalog
    },
  ],
  navigation: [
    {
      type: "link",
      label: "API Reference",
      to: "/api",
    },
  ],
};
```

See the [API Reference](/docs/configuration/api-reference) page for full details on configuring
individual APIs, including versioning and customization options.
