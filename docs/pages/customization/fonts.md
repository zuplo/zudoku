---
sidebar_icon: baseline
title: Font & Typography
sidebar_label: Font & Typography
---

When it comes to fonts Zudoku allows you to define a font for text `sans` and for code `mono`. You can use an external source or a local source.

## External source

```typescript
const config = {
  theme: {
    fonts: {
      sans: {
        fontFamily: "Roboto, sans-serif",
        url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
      },
      mono: {
        fontFamily: "Roboto Mono, monospace",
        url: "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
      },
    },
  },
};
```

## Local source

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

Then you can create a `fonts` object in your config as above and set the `url` to `/fonts.css`.

```typescript
const config = {
  theme: {
    fonts: {
      sans: {
        fontFamily: "Roboto, sans-serif",
        url: "/fonts.css",
      },
      mono: {
        fontFamily: "Roboto Mono, monospace",
        url: "/fonts.css",
      },
    }
  },
};
```
