---
sidebar_icon: user-cog
---

# Customization

## Theme Colors

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
      radius: "0.5rem",
    },
    dark: {
      // Dark mode colors...
    },
  },
};
```

### Available Theme Variables

The following theme variables are available for customization:

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

## Font

### External source

```typescript
const config = {
  theme: {
    sans: {
      fontFamily: "Roboto, sans-serif",
      url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
    },
    // same for `mono`
  },
};
```

### Local source

To use local fonts you can add them to the `public` folder and create a `fonts.css` in there:

```css
@font-face {
  font-family: "Roboto";
  font-style: normal;
  font-weight: 400;
  src: url("/roboto-400.woff2") format("woff2");
}
/* ... */
```

Then you can create a `font` object in your config as above and set the `url` to `/fonts.css`.

```typescript
const config = {
  theme: {
    sans: {
      fontFamily: "Roboto, sans-serif",
      url: "/fonts.css",
    },
  },
};
```
