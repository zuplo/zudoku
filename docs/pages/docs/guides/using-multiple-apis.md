---
title: Multiple APIs
sidebar_icon: file-stack
---

Zudoku supports creating documentation and API references for multiple APIs and can work with as
many OpenAPI documents as you need.

In order to do this you will need to modify the [Zudoku Configuration](../configuration/overview.md)
file to include additional APIs.

## Configuration

Using multiple APIs is a configuration setting that you can add in the
[Zudoku Configuration](../configuration/overview.md) file.

### Step 1: Define your API paths

Each API is mounted at a `path` and linked from the navigation with a matching `to`. Define those
paths once with `createPath` so the two references can never drift apart:

```typescript
import { createPath } from "zudoku";

const firstApi = createPath("/my-first-api");
const secondApi = createPath("/my-second-api");
```

### Step 2: Add your APIs

Create a new array in your configuration file that lists each API you want to include, using the
paths you defined above:

```typescript
const apis = [
  {
    type: "file",
    input: "apis/my-first-api.json",
    path: firstApi,
  },
  {
    type: "file",
    input: "apis/my-second-api.json",
    path: secondApi,
  },
] as const;
```

### Step 3: Add navigation

Create a navigation array for your sidebar, referencing the same paths:

```typescript
const navigation = [
  {
    type: "link",
    label: "My First API",
    to: firstApi,
  },
  {
    type: "link",
    label: "My Second API",
    to: secondApi,
  },
] as const;
```

### Step 4: Update your config

Modify your [Zudoku Configuration](../configuration/overview.md) file to include these arrays:

```typescript
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  navigation: [
    {
      type: "category",
      label: "Overview",
      items: navigation,
    },
  ],
  redirects: [{ from: "/", to: "/overview" }],
  apis,
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
};

export default config;
```

Make sure that:

1. Your OpenAPI files are placed in the correct location as specified in the `input` field
2. The `label` in navigation matches what you want to display in the sidebar

Because each `path` and its matching `to` reference the same `createPath` value, you no longer have
to keep the two in sync by hand.

You don't necessarily need to add the APIs to your sidebar, you can also put them into the top
navigation or link to them from your docs.
