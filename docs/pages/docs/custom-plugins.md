---
title: Custom Plugins
sidebar_icon: list-end
---

Zudoku is highly extensible. You can create custom plugins to add new functionality to your
documentation site. This guide will show you how to create and use plugins in your Zudoku
configuration.

## Plugin Types

All plugins in Zudoku must implement the `ZudokuPlugin` type, which is a union of these plugin
interfaces:

- **CommonPlugin**: Basic plugin with initialization, head elements, and MDX component customization
- **ProfileMenuPlugin**: Add custom items to the profile menu
- **NavigationPlugin**: Define custom routes and sidebar items
- **ApiIdentityPlugin**: Provide API identities for testing
- **SearchProviderPlugin**: Implement custom search functionality
- **EventConsumerPlugin**: Handle custom events
- **TransformConfigPlugin**: Modify configuration at build-time

You can find all available plugin interfaces in the
[Zudoku source code](https://github.com/zuplo/zudoku/blob/main/packages/zudoku/src/lib/core/plugins.ts).

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

### Google Tag Manager

Below is a sample of adding the necessary scripts for GTM, but this could apply to any tag manager
or tracking script.

```tsx
import { ZudokuPlugin } from "zudoku";

const commonPlugin: ZudokuPlugin = {
  getHead: () => {
    return (
      <script>
        {`
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", "GTM-<YOUR GTM ID HERE>");`}
      </script>
    );
  },
};
```

#### Tracking `page_view` Events

Zudoku is a single page application so typical `page_view` events are not captured by most analytics
scripts or tag managers. Instead, you must listen to the `location` [event](./extending/events.md)
with a plugin and log navigation changes in code.

```tsx
import { ZudokuPlugin, ZudokuEvents } from "zudoku";

const navigationLoggerPlugin: ZudokuPlugin = {
  events: {
    location: ({ from, to }) => {
      if (!from) return;
      window.dataLayer.push({
        event: "page_view",
        page_path: to.pathname,
        page_title: document.title,
        page_location: window.location.href,
      });
    },
  },
};
```

If you are using TypeScript, you will also need to add the following type declaration to the file
this plugin is declared

```ts
declare global {
  interface Window {
    dataLayer: Record<string, any>[];
  }
}
```

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

### Wrapping Routes with Context or Layout

You can wrap your plugin's routes with a context provider or custom layout using React Router's
nested route pattern. The parent route renders an `<Outlet />` where child routes will appear.

```tsx
import { createContext, useContext } from "react";
import type { ZudokuPlugin, RouteObject } from "zudoku";
import { Outlet } from "zudoku/router";

const MyContext = createContext("value");

const pluginWithContext: ZudokuPlugin = {
  getRoutes: () => [
    {
      element: (
        <MyContext.Provider value="hello">
          <Outlet />
        </MyContext.Provider>
      ),
      children: [
        { path: "/custom", element: <CustomPage /> },
        { path: "/custom/nested", element: <NestedPage /> },
      ],
    },
  ],
};
```

All child routes will have access to `MyContext`. This pattern works for any wrapper including
layouts, error boundaries, or data providers.

### Dropdown Navigation Plugin

```tsx
import { ZudokuPlugin, RouteObject } from "zudoku";
import { UserIcon } from "zudoku/icons";

const AccountPageNavItemPlugin: ZudokuPlugin = {
  getRoutes: (): RouteObject[] => {
    return [
      {
        path: "/account",
        element: <Account />, // This is a custom page
      },
    ];
  },
  getProfileMenuItems: () => {
    return [
      {
        label: "Account",
        path: "/account",
        category: "middle",
        icon: UserIcon,
      },
    ];
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

### Transform Config Plugin

The `transformConfig` hook allows plugins to modify the Zudoku configuration at build-time. This is
useful for dynamically adding navigation items, modifying theme settings, or adjusting any other
configuration based on external data or conditions.

```tsx
import { ZudokuPlugin } from "zudoku";

const transformConfigPlugin: ZudokuPlugin = {
  transformConfig: ({ config, merge }) => {
    // Option 1: Use merge helper for deep merging
    return merge({
      slots: {
        "head-navigation-start": () => <a href="/pricing">Pricing</a>,
      },
    });

    // Option 2: Manual spread for full control
    return {
      ...config,
      navigation: [
        ...(config.navigation ?? []),
        {
          type: "link",
          label: "System Status",
          to: "https://status.example.com",
          icon: "activity",
        },
      ],
    };
  },
};
```

The `transformConfig` function receives an object with:

- **config**: The current Zudoku configuration object
- **merge**: A helper function that deep merges a partial config with the current config

The function must return a full configuration object (either via `merge()` or manual spreading), or
`void` to make no changes. The hook can also be async.
