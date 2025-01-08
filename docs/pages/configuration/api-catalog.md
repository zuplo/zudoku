---
title: API Catalog
sidebar_icon: book-open
---

If you're dealing with multiple APIs and multiple OpenAPI files the API Catalog comes in handy. It creates an overview over all your APIs and lets you organize them in Catagories and Tags.

## Enable API Catalog

The first step to enable the API Catalog, you need to add a `catalog` object to your Zudoku configuration file.

```js
const config = {
  // ...
  catalog: {
    navigationId: "catalog",
    label: "API Catalog",
  },
  // ...
};
```

You can then add your APIs to the catalog by adding the `categories` property to your API configuration.

```js
const config = {
  // ...
  apis: [
    // ...
    {
      type: "file",
      input: "./operational.json",
      navigationId: "api-operational",
      categories: [{ label: "General", tags: ["Operational"] }],
    },
    {
      type: "file",
      input: "./enduser.json",
      navigationId: "api-enduser",
      categories: [{ label: "General", tags: ["End-User"] }],
    },
    {
      type: "file",
      input: "./openapi.json",
      navigationId: "api-auth",
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

```js
const config = {
  // ...
  catalog: {
    navigationId: "catalog",
    label: "API Catalog",
    // Only show the operational API in the catalog
    items: ["api-operational"],
  },
  apis: [
    // ...
    {
      type: "file",
      input: "./operational.json",
      navigationId: "api-operational",
      categories: [{ label: "General", tags: ["Operational"] }],
    },
    {
      type: "file",
      input: "./enduser.json",
      navigationId: "api-enduser",
      categories: [{ label: "General", tags: ["End-User"] }],
    },
  ],
  // ...
};
```

### Adding authentication & filter items for user

You can filter which APIs are shown in the catalog by using the `filter` property.

```js
const config = {
  // ...
  catalog: {
    navigationId: "catalog",
    label: "API Catalog",
    filterItems: (items, { auth: AuthState }) => {
      return items.filter((items) => items.tags.includes(auth));
    },
  },
  // ...
};
```
