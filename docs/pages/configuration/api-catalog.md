---
title: API Catalog
sidebar_icon: book-open
---

If you're dealing with multiple APIs and multiple OpenAPI files, the API Catalog comes in handy. It creates an overview of all your APIs and lets you organize them into categories and tags.

## Enable API Catalog

The first step to enable the API Catalog, you need to add a `catalogs` object to your Zudoku configuration file.

```js title=zudoku.config.ts
const config = {
  // ...
  catalogs: {
    path: "catalog",
    label: "API Catalog",
  },
  // ...
};
```

You can then add your APIs to the catalog by adding the `categories` property to your API configuration.

```js title=zudoku.config.ts
const config = {
  // ...
  apis: [
    // ...
    {
      type: "file",
      input: "./operational.json",
      path: "api-operational",
      categories: [{ label: "General", tags: ["Operational"] }],
    },
    {
      type: "file",
      input: "./enduser.json",
      path: "api-enduser",
      categories: [{ label: "General", tags: ["End-User"] }],
    },
    {
      type: "file",
      input: "./openapi.json",
      path: "api-auth",
      categories: [{ label: "Other", tags: ["Authentication"] }],
    },
    // ...
  ],
  // ...
};
```

## Advanced Configuration

### Select APIs to show in the catalog

You can select which APIs are shown in the catalog by using the `items` property. The `items` property is an array of navigation IDs of the APIs you want to show in the catalog.

```js title=zudoku.config.ts
const config = {
  // ...
  catalogs: {
    path: "catalog",
    label: "API Catalog",
    // Only show the operational API in the catalog
    items: ["api-operational"],
  },
  apis: [
    // ...
    {
      type: "file",
      input: "./operational.json",
      path: "api-operational",
      categories: [{ label: "General", tags: ["Operational"] }],
    },
    {
      type: "file",
      input: "./enduser.json",
      path: "api-enduser",
      categories: [{ label: "General", tags: ["End-User"] }],
    },
  ],
  // ...
};
```

### Filtering catalog items

You can filter which APIs are shown in the catalog by using the `filterItems` property. The function receives the items and context as arguments.

```js title=zudoku.config.ts
const config = {
  // ...
  catalogs: {
    path: "catalog",
    label: "API Catalog",
    filterItems: (items, { auth: AuthState }) => {
      return items.filter((items) => items.tags.includes(auth));
    },
  },
  // ...
};
```
