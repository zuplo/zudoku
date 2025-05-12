---
title: Custom Plugins
sidebar_icon: list-end
---

Zudoku is highly extensible. You can create custom plugins to add new functionality to your documentation site. This guide will show you how to create and use plugins in your Zudoku configuration.

## Plugin Types

All plugins in Zudoku must implement the `ZudokuPlugin` type, which is a union of these plugin interfaces:

- **CommonPlugin**: Basic plugin with initialization, head elements, and MDX component customization
- **ProfileMenuPlugin**: Add custom items to the profile menu
- **NavigationPlugin**: Define custom routes and sidebar items
- **ApiIdentityPlugin**: Provide API identities for testing
- **SearchProviderPlugin**: Implement custom search functionality
- **EventConsumerPlugin**: Handle custom events

You can find all available plugin interfaces in the [Zudoku source code](https://github.com/zuplo/zudoku/blob/main/packages/zudoku/src/lib/core/plugins.ts).

## Defining Plugins

You can define plugins in your Zudoku configuration using objects with explicit type declarations:

### Common Plugin Example

```tsx
import { ZudokuPlugin } from "zudoku";

const commonPlugin: ZudokuPlugin = {
  initialize: async (context) => {
    // Initialization logic
  },
  getHead: () => <link rel="stylesheet" href="/custom-styles.css" />,
  getMdxComponents: () => ({
    // Custom MDX components
  }),
};

const config: ZudokuConfig = {
  // ... other config
  plugins: [commonPlugin],
};
```

### API Identity Plugin Example

```tsx
import { ZudokuPlugin, ApiIdentity } from "zudoku";

const apiIdentityPlugin: ZudokuPlugin = {
  getIdentities: async (context) => {
    return [
      {
        label: "Test User",
        id: "test-user",
        authorizeRequest: (request: Request) => {
          request.headers.set("Authorization", "Bearer test-token");
          return request;
        },
      },
    ] as ApiIdentity[];
  },
};

// In your zudoku.config.tsx
const config: ZudokuConfig = {
  // ... other config
  plugins: [apiIdentityPlugin],
};
```

## Example Implementations

Here are some common plugin implementations:

### Navigation Plugin

```tsx
import { ZudokuPlugin, RouteObject } from "zudoku";

const navigationPlugin: ZudokuPlugin = {
  getRoutes: (): RouteObject[] => {
    return [
      {
        path: "/custom",
        element: <CustomPage />,
      },
    ];
  },
  getSidebar: async (path: string) => {
    // Return custom sidebar items
    return {
      items: [{ id: "custom", label: "Custom Page" }],
    };
  },
};
```

### Event Consumer Plugin

```tsx
import { ZudokuPlugin } from "zudoku";

const eventConsumerPlugin: ZudokuPlugin = {
  events: {
    location: ({ from, to }) => {
      if (!from) {
        console.log(`Initial navigation to: ${to.pathname}`);
      } else {
        console.log(`Navigation from ${from.pathname} to ${to.pathname}`);
      }
    },
  },
};
```
