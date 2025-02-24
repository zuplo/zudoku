---
title: Events
sidebar_icon: shuffle
---

Zudoku provides an events system that allows plugins to react to various application events. This system enables you to build dynamic features that respond to user interactions and application state changes.

## Available Events

Currently, Zudoku supports the following events:

### location

```typescript
type LocationEvent = (e: { from?: Location; to: Location }) => void;
```

Emitted when the user navigates to a different route. Provides both the previous (`from`) and current (`to`) [Location objects](https://api.reactrouter.com/v7/interfaces/react_router.Location.html) from react-router.

Note that the `from` location will be undefined on the initial page load.

## Consuming Events in Plugins

To consume events in your plugin, you can implement the events property in your plugin. This is useful for performing actions like sending analytics events or anything else that's not directly related to the UI.

```typescript
import { ZudokuPlugin, ZudokuEvents } from "zudoku";

const navigationLoggerPlugin: ZudokuPlugin = {
  events: {
    location: ({ from, to }) => {
      if (!from) {
        console.log(`Initial navigation to: ${to.pathname}`);
      } else {
        console.log(`User navigated from: ${from.pathname} to: ${to.pathname}`);
      }
    },
  },
};
```

### Example in Zudoku Config

In your `zudoku.config.ts`, you can define the events like this:

```typescript
export default {
  plugins: [
    {
      events: {
        location: ({ from, to }) => {
          if (!from) return;

          // E.g. send an analytics event
          sendAnalyticsEvent({
            from: from.pathname,
            to: to.pathname,
          });
        },
      },
    },
  ],
};
```

## Using Events in Components

Zudoku provides a convenient `useEvent` hook to subscribe to events in your React components. The hook can be used in three different ways:

### 1. Getting the Latest Event Data

If you just want to access the latest event data without a callback:

```typescript
import { useEvent } from "zudoku/hooks";

function MyComponent() {
  const locationEvent = useEvent("location");
  return <div>Current path: {locationEvent?.to.pathname}</div>;
}
```

### 2. Using Event Data in a Component

If you want to transform the event data, return a value from the callback:

```typescript
import { useEvent } from "zudoku/hooks";

function MyComponent() {
  const pathname = useEvent("location", ({ to }) => to.pathname);
  return <div>Current path: {pathname}</div>;
}
```

### 3. Using a Callback for Side Effects

If you just want to perform side effects when the event occurs:

```typescript
import { useEvent } from "zudoku/hooks";

function MyComponent() {
  useEvent("location", ({ from, to }) => {
    if (from) {
      console.log(`Navigation: ${from.pathname} → ${to.pathname}`);
    }
    // No return value needed for side effects
  });

  return <div>My Component</div>;
}
```

The `useEvent` hook automatically handles subscription and cleanup in the React lifecycle, making it easy to work with events in your components.
