---
title: Navigation Migration
sidebar_icon: arrows-left-right
---

This guide explains how to migrate existing configurations that used `topNavigation`, `sidebar` and `customPages` to the new unified `navigation` configuration introduced in vNEXT.

## Overview

Navigation is now configured through a single `navigation` array. Items at the root level become top navigation tabs, while nested categories automatically form the sidebar. Custom pages are added using the `custom-page` item type.

## Before and After

```tsx title="Before"
const config: ZudokuConfig = {
  topNavigation: [
    { id: "docs", label: "Docs" },
    { id: "api", label: "API" },
  ],
  sidebar: {
    docs: [{ type: "doc", id: "introduction" }],
  },
  customPages: [{ path: "/playground", render: Playground, prose: false }],
  apis: {
    type: "file",
    input: "./openapi.json",
    navigationId: "api",
  },
};
```

```tsx title="After"
const config: ZudokuConfig = {
  navigation: [
    {
      type: "category",
      label: "Docs",
      items: ["introduction"],
    },
    {
      type: "custom-page",
      path: "/playground",
      element: <Playground />,
    },
    {
      type: "link",
      to: "api",
      label: "API",
    },
  ],
  apis: [
    {
      path: "/api",
      type: "file",
      input: "./openapi.json",
    },
  ],
};
```

## Migration steps

<Stepper>

1. **Create a `navigation` array**

   Move all items from `topNavigation` and your sidebar into a new `navigation` array.

1. **Convert custom pages**

   Replace entries in `customPages` with `type: "custom-page"` items inside `navigation`.

1. **Update plugin configs**

   Replace all uses of `navigationId` with `path` in plugin options like `apis` or `catalogs`. Navigation items of type `link` should use the `to` property to reference the path of the API or catalog.

1. **Reference plugin paths in navigation**

   Items produced by plugins are not added automatically. Add links or categories in your `navigation` so users can access them.

</Stepper>
