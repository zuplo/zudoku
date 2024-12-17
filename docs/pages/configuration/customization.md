---
sidebar_icon: user-cog
---

# Customization

<!-- TODO: add theme colors -->

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
