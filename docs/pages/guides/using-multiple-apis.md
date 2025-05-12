---
title: Multiple APIs
sidebar_icon: file-stack
---

Zudoku supports creating documentation and API references for multiple APIs and can work with as many OpenAPI documents as you need.

In order to do this you will need to modify the [Zudoku Configuration](../configuration/overview.md) file to include additional APIs.

## Configuration

Using multiple APIs is a configuration setting that you can add in the [Zudoku Configuration](../configuration/overview.md) file.

### Step 1: Add your APIs

First, create a new array in your configuration file that lists each API you want to include:

```typescript
const apis = [
  {
    type: "file",
    input: "apis/my-first-api.json",
    navigationId: "my-first-api",
  },
  {
    type: "file",
    input: "apis/my-second-api.json",
    navigationId: "my-second-api",
  },
] as const;
```

### Step 2: Add navigation

Create a navigation array for your sidebar:

```typescript
const navigation = [
  {
    type: "link",
    label: "My First API",
    href: "my-first-api",
  },
  {
    type: "link",
    label: "My Second API",
    href: "my-second-api",
  },
] as const;
```

### Step 3: Update your config

Modify your [Zudoku Configuration](../configuration/overview.md) file to include these arrays:

```typescript
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  topNavigation: [
    {
      id: "overview",
      label: "Overview",
    },
  ],
  sidebar: {
    overview: navigation,
  },
  redirects: [{ from: "/", to: "/overview" }],
  apis,
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
};

export default config;
```

Make sure that:

1. The `navigationId` in each API config matches the `href` in the navigation
2. Your OpenAPI files are placed in the correct location as specified in the `input` field
3. The `label` in navigation matches what you want to display in the sidebar

You don't necessarily need to add the APIs to your sidebar, you can also put them into the top navigation or link to them from your docs.
