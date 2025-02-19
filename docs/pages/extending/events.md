---
title: Events
sidebar_icon: shuffle
---

# Events

Zudoku provides an events system that allows plugins to react to various application events. This system enables you to build dynamic features that respond to user interactions and application state changes.

## Available Events

Currently, Zudoku supports the following events:

- `location` - Emitted when the user navigates to a different route. Provides the current location object from React Router.

## Using Events in Plugins

To consume events in your plugin, you can implement the events property in your plugin:

```typescript
import { ZudokuPlugin, ZudokuEvents } from "zudoku";

const navigationLoggerPlugin: ZudokuPlugin = {
  events: {
    location: (location) => {
      console.log(`User navigated to: ${location.pathname}`);
    },
  },
};
```

## Using Events in Components

Zudoku provides a convenient `useEvent` hook to subscribe to events in your React components:

```typescript
import { useEvent } from "zudoku/hooks/useEvent";

function MyComponent() {
  useEvent("location", (location) => {
    console.log("Location changed:", location);
  });

  return <div>My Component</div>;
}
```

The `useEvent` hook automatically handles subscription and cleanup in the React lifecycle, making it easy to work with events in your components.

For more advanced use cases, you can also use the lower-level `useZudoku` hook to access the event system directly:

```typescript
import { useZudoku } from "zudoku";

function MyComponent() {
  const zudoku = useZudoku();

  useEffect(() => {
    const unsubscribe = zudoku.addEventListener("location", (location) => {
      console.log("Location changed:", location);
    });

    return () => unsubscribe();
  }, [zudoku]);

  return <div>My Component</div>;
}
```

## Emitting Events

The Zudoku context provides an `emitEvent` method to trigger events programmatically:

```typescript
const zudoku = useZudoku();
zudoku.emitEvent("location", locationObject);
```
