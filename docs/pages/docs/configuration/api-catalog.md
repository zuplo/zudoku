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

:::caution{title="Recommendation: nest API paths under the catalog path"}

For a consistent user experience, APIs that appear in the catalog should have their `path` prefixed
with the catalog path. For example, if your catalog is at `/catalog`, an API path should start with
`/catalog/` (e.g., `/catalog/api-users`). APIs with paths outside the catalog path still appear in
the catalog, but clicking them navigates the user outside the catalog section.

:::

Define the catalog path once with `createPath` and derive each API path from it, so the nested paths
stay consistent with the catalog automatically:

```ts title=zudoku.config.ts
import { createPath, joinUrl } from "zudoku";

const catalog = createPath("/catalog");

const config = {
  catalogs: {
    path: catalog,
    label: "API Catalog",
  },
  apis: [
    {
      type: "file",
      input: "./operational.json",
      path: createPath(joinUrl(catalog, "api-operational")), // Nested under the catalog
      categories: [{ label: "General", tags: ["Operational"] }],
    },
    {
      type: "file",
      input: "./enduser.json",
      path: createPath(joinUrl(catalog, "api-enduser")),
      categories: [{ label: "General", tags: ["End-User"] }],
    },
    {
      type: "file",
      input: "./openapi.json",
      path: createPath(joinUrl(catalog, "api-auth")),
      categories: [{ label: "Other", tags: ["Authentication"] }],
    },
  ],
};
```

To add the catalog to your navigation, use a link item pointing at the same `catalog` path:

```ts title=zudoku.config.ts
const config = {
  navigation: [
    {
      type: "link",
      label: "API Catalog",
      to: catalog,
      icon: "square-library",
    },
  ],
  // ... catalogs and apis config
};
```

## Advanced Configuration

### Filtering catalog items

You can filter which APIs are shown in the catalog by using the `filterItems` property. The function
receives the items and the catalog context (including `auth`) as arguments. Each item has a
`categories` array where each category has a `label` and `tags`.

```ts title=zudoku.config.ts
const config = {
  catalogs: {
    path: "/catalog",
    label: "API Catalog",
    filterItems: (items, { auth }) => {
      return items.filter((item) =>
        item.categories?.some((category) => category.tags?.includes("public")),
      );
    },
  },
};
```

## Standalone APIs (without catalog)

APIs that are **not** part of a catalog can use any path and will appear as standalone API reference
pages. These APIs don't need `categories` and their paths don't need to be nested under a catalog.

```ts title=zudoku.config.ts
import { createPath } from "zudoku";

const apiReference = createPath("/api"); // standalone, not under a catalog

const config = {
  apis: [
    {
      type: "file",
      input: "./openapi.json",
      path: apiReference,
    },
  ],
  navigation: [
    {
      type: "link",
      label: "API Reference",
      to: apiReference,
    },
  ],
};
```

See the [API Reference](/docs/configuration/api-reference) page for full details on configuring
individual APIs, including versioning and customization options.
