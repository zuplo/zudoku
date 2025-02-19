---
title: Events
sidebar_icon: shuffle
---

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

Zudoku provides a convenient `useEvent` hook to subscribe to events in your React components. The hook can be used in three different ways:

### 1. Getting the Latest Event Data

If you just want to access the latest event data without a callback:

```typescript
import { useEvent } from "zudoku/hooks";

function MyComponent() {
  const location = useEvent("location");
  return <div>Current path: {location?.pathname}</div>;
}
```

### 2. Using a Callback with Return Value

If you want to transform the event data, return a value from the callback:

```typescript
import { useEvent } from "zudoku/hooks";

function MyComponent() {
  const pathname = useEvent("location", (location) => location.pathname);
  return <div>Current path: {pathname}</div>;
}
```

### 3. Using a Callback for Side Effects

If you just want to perform side effects when the event occurs:

```typescript
import { useEvent } from "zudoku/hooks";

function MyComponent() {
  useEvent("location", (location) => {
    console.log("Location changed:", location);
    // No return value needed for side effects
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
