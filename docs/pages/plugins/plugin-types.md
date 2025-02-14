---
title: Plugin Types
sidebar_icon: puzzle
---

# Zudoku Plugin Types

Zudoku supports several types of plugins that allow you to extend its functionality in different ways. This guide covers all available plugin types and provides examples for each.

## Composable Plugin System

One of the powerful features of Zudoku's plugin system is its composability. A single plugin can implement multiple plugin interfaces, allowing you to combine different functionalities into a single cohesive plugin. This means you can:

- Combine multiple plugin types into a single plugin
- Share state and logic between different plugin functionalities
- Create more complex and feature-rich plugins
- Reduce code duplication and improve maintainability

For example, you can create a plugin that combines navigation, profile menu items, and custom MDX components:

```typescript
import { type CommonPlugin, type NavigationPlugin, type ProfileMenuPlugin } from "@zudoku/core";
import { CustomPage } from "./components/CustomPage";
import { Settings } from "lucide-react";

export const myCompositePlugin: CommonPlugin & NavigationPlugin & ProfileMenuPlugin = {
  // CommonPlugin methods
  initialize(context) {
    console.log("Initializing composite plugin");
    return true;
  },

  getMdxComponents() {
    return {
      CustomComponent: (props) => <div {...props} />,
    };
  },

  // NavigationPlugin methods
  getRoutes() {
    return [
      {
        path: "/settings",
        element: <CustomPage />,
      },
    ];
  },

  // ProfileMenuPlugin methods
  getProfileMenuItems(context) {
    return [
      {
        label: "Settings",
        path: "/settings",
        category: "top",
        icon: Settings,
      },
    ];
  },
};
```

## Common Plugin

The `CommonPlugin` interface is the base plugin type that provides core functionality.

```typescript
interface CommonPlugin {
  initialize?: (context: ZudokuContext) => Promise<void | boolean> | void | boolean;
  getHead?: () => ReactElement | undefined;
  getMdxComponents?: () => MdxComponentsType;
}
```

### Example

```typescript
import { type CommonPlugin, type ZudokuContext } from "@zudoku/core";
import { type ReactElement } from "react";

export const myCommonPlugin: CommonPlugin = {
  async initialize(context: ZudokuContext) {
    // Perform initialization tasks
    console.log("Plugin initialized");
    return true;
  },

  getHead() {
    return (
      <head>
        <title>Custom Title</title>
        <meta name="description" content="Custom description" />
      </head>
    );
  },

  getMdxComponents() {
    return {
      CustomComponent: (props) => <div {...props} />,
    };
  },
};
```

## Profile Menu Plugin

The `ProfileMenuPlugin` allows you to add custom items to the profile navigation menu.

```typescript
interface ProfileMenuPlugin {
  getProfileMenuItems: (context: ZudokuContext) => ProfileNavigationItem[];
}

type ProfileNavigationItem = {
  label: string;
  path?: string;
  weight?: number;
  category?: "top" | "middle" | "bottom";
  children?: ProfileNavigationItem[];
  icon?: LucideIcon;
};
```

### Example

```typescript
import { type ProfileMenuPlugin, type ZudokuContext } from "@zudoku/core";
import { Settings, UserCircle } from "lucide-react";

export const myProfileMenuPlugin: ProfileMenuPlugin = {
  getProfileMenuItems(context: ZudokuContext) {
    return [
      {
        label: "Profile",
        path: "/profile",
        category: "top",
        icon: UserCircle,
      },
      {
        label: "Settings",
        path: "/settings",
        category: "middle",
        icon: Settings,
        children: [
          {
            label: "Account",
            path: "/settings/account",
          },
        ],
      },
    ];
  },
};
```

## Navigation Plugin

The `NavigationPlugin` allows you to add custom routes and sidebar items to your documentation.

```typescript
interface NavigationPlugin {
  getRoutes: () => RouteObject[];
  getSidebar?: (path: string) => Promise<Sidebar>;
}
```

### Example

```typescript
import { type NavigationPlugin } from "@zudoku/core";
import { CustomPage } from "./components/CustomPage";

export const myNavigationPlugin: NavigationPlugin = {
  getRoutes() {
    return [
      {
        path: "/custom",
        element: <CustomPage />,
      },
    ];
  },

  async getSidebar(path: string) {
    return {
      items: [
        {
          type: "link",
          label: "Custom Page",
          href: "/custom",
        },
      ],
    };
  },
};
```

## API Identity Plugin

The `ApiIdentityPlugin` allows you to provide custom API identities for authentication.

```typescript
interface ApiIdentityPlugin {
  getIdentities: (context: ZudokuContext) => Promise<ApiIdentity[]>;
}
```

### Example

```typescript
import { type ApiIdentityPlugin, type ZudokuContext } from "@zudoku/core";

export const myApiIdentityPlugin: ApiIdentityPlugin = {
  async getIdentities(context: ZudokuContext) {
    return [
      {
        id: "api-key-1",
        name: "Development API Key",
        type: "api-key",
        value: "your-api-key",
      },
    ];
  },
};
```

## Search Provider Plugin

The `SearchProviderPlugin` allows you to implement custom search functionality.

```typescript
interface SearchProviderPlugin {
  renderSearch: (o: { isOpen: boolean; onClose: () => void }) => React.JSX.Element | null;
}
```

### Example

```typescript
import { type SearchProviderPlugin } from "@zudoku/core";
import { SearchDialog } from "./components/SearchDialog";

export const mySearchPlugin: SearchProviderPlugin = {
  renderSearch({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
      <SearchDialog
        onClose={onClose}
        onSearch={(query) => {
          // Implement search logic
          console.log("Searching for:", query);
        }}
      />
    );
  },
};
```

## Using Plugins

To use plugins in your Zudoku configuration, you can add them to the `plugins` array in your `zudoku.config.ts` file. You can mix and match both single-purpose and composite plugins:

```typescript
// zudoku.config.ts
import { defineConfig } from "@zudoku/core";
import { myCompositePlugin } from "./plugins/composite";
import { mySearchPlugin } from "./plugins/search";
import { myApiIdentityPlugin } from "./plugins/api-identity";

export default defineConfig({
  // Configuration options...
  plugins: [
    // A plugin implementing multiple interfaces
    myCompositePlugin,

    // Single-purpose plugins
    mySearchPlugin,
    myApiIdentityPlugin,

    // You can also define simple plugins inline
    {
      getProfileMenuItems: (context) => [
        {
          label: "Documentation",
          path: "/docs",
          category: "middle",
        },
      ],
    },
  ],
});
```

Zudoku will automatically detect which interfaces each plugin implements and use them accordingly. This allows you to:

- Organize your plugins based on features rather than technical interfaces
- Create modular and reusable plugin components
- Mix both complex composite plugins and simple single-purpose plugins
- Define simple plugins inline when appropriate

Each plugin type serves a specific purpose in extending Zudoku's functionality. You can implement one or multiple plugin interfaces based on your needs, and combine them in ways that make sense for your application.
