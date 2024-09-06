---
title: Multiple APIs
sidebar_icon: file-stack
---

Zudoku supports creating documentation and API references for multiple APIs and can work with as many OpenAPI documents as you need.

In order to do this you will need to modify the [Zudoku Configuration](/docs/configuration/overview) file to include additional APIs.

## Configuration

Using multiple APIs is a configuration setting that you can add in the [Zudoku Configuration](/docs/configuration/overview) file.

### Step 1: Add all your APIs

First, create a new array in [Zudoku Configuration](/docs/configuration/overview) that lists each API you want to include as its own object:

```typescript
const navigation = [
  {
    label: "The first API",
    id: "the-first-api-openapi",
  },
  {
    label: "The second API",
    id: "the-second-api",
  },
];
```

### Step 2: Modify the config

Modify the [Zudoku Configuration](/docs/configuration/overview) file so that the `sidebar` and `apis` settings look the same as below:

```typescript
import { type ZudokuConfig } from "zudoku";

const navigation = [
  {
    label: "The first API",
    id: "the-first-api-openapi",
  },
  {
    label: "The second API",
    id: "the-second-api",
  },
];

const config: ZudokuConfig = {
  topNavigation: [
    { id: "home", label: "Home" },
    { id: "home2", label: "Home 2" },
  ],
  redirects: [{ from: "/", to: "/home" }],
  sidebar: {
    home: [
      ...navigation.map((item) => ({
        type: "link",
        label: item.label,
        href: `/${item.id}`,
      })),
    ],
  },
  apis: [
    ...navigation.map((item) => ({
      type: "url",
      input: `http://example.com/api/${item.id}.json`,
      navigationId: item.label,
      skipPreload: true,
    })),
  ],
};

export default config;
```

As you can see in the example above, we have added additional code that maps through the items in the `navigation` array and creates new sidebar items, as well as the correct URLs for the APIs.
