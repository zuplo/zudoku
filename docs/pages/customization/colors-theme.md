---
sidebar_icon: paintbrush
title: Colors & Theme
---

## Colors

You can customize the theme colors for both light and dark modes. Colors can be specified using hex values (which will be automatically converted to HSL) or direct HSL values.

```typescript
const config = {
  theme: {
    light: {
      background: "#ffffff",
      foreground: "#020817",
      card: "#ffffff",
      cardForeground: "#020817",
      popover: "#ffffff",
      popoverForeground: "#020817",
      primary: "#0284c7",
      primaryForeground: "#ffffff",
      secondary: "#f1f5f9",
      secondaryForeground: "#020817",
      muted: "#f1f5f9",
      mutedForeground: "#64748b",
      accent: "#f1f5f9",
      accentForeground: "#020817",
      destructive: "#ef4444",
      destructiveForeground: "#ffffff",
      border: "#e2e8f0",
      input: "#e2e8f0",
      ring: "#0284c7",
    },
    dark: {
      // Dark mode colors...
    },
  },
};
```

## Radius

The `radius` property sets the border radius for the theme. It can be a single value, and all radii will inherit from that value.

```typescript
export default {
  theme: {
    dark: {
      // other theme variables...
      radius: "0.5rem",
    },
    light: {
      radius: "0.5rem",
    },
  },
};
```

or to make sure the radius is the same for both light and dark modes you can use a variable:

```typescript
const radius = "0.5rem";
export default {
  theme: {
    dark: {
      radius,
    },
    light: {
      radius,
    },
  },
};
```

## Available Theme Variables

- `background` - Main background color
- `foreground` - Main text color
- `card` - Card background color
- `cardForeground` - Card text color
- `popover` - Popover background color
- `popoverForeground` - Popover text color
- `primary` - Primary action color
- `primaryForeground` - Text color on primary backgrounds
- `secondary` - Secondary action color
- `secondaryForeground` - Text color on secondary backgrounds
- `muted` - Muted/subtle background color
- `mutedForeground` - Text color for muted elements
- `accent` - Accent color for highlights
- `accentForeground` - Text color on accent backgrounds
- `destructive` - Color for destructive actions
- `destructiveForeground` - Text color on destructive backgrounds
- `border` - Border color
- `input` - Input field border color
- `ring` - Focus ring color
- `radius` - Border radius value
