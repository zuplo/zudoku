---
sidebar_icon: baseline
title: Font & Typography
sidebar_label: Font & Typography
description:
  Learn how to customize fonts and typography in Zudoku using predefined Google Fonts, custom font
  URLs, or local fonts for sans, serif, and monospace text.
---

Zudoku allows you to customize fonts for text (`sans`), serif content (`serif`), and code (`mono`).
You can use predefined Google Fonts, external sources, or local fonts.

## Predefined Google Fonts

The easiest way to use fonts is with predefined Google Fonts. Simply specify the font name as a
string:

```tsx title=zudoku.config.ts
const config = {
  theme: {
    fonts: {
      sans: "Inter",
      serif: "Merriweather",
      mono: "JetBrains Mono",
    },
  },
};
```

### Available Google Fonts

The following fonts are available as predefined options:

**Sans Serif:** Inter, Roboto, Open Sans, Poppins, Montserrat, Outfit, Plus Jakarta Sans, DM Sans,
IBM Plex Sans, Geist, Oxanium, Space Grotesk

**Serif:** Architects Daughter, Merriweather, Playfair Display, Lora, Source Serif Pro, Libre
Baskerville

**Monospace:** JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Roboto Mono, Space Mono,
Geist Mono

## Custom Font URLs

For more control or to use fonts not in the predefined list, you can specify a custom font URL:

```tsx title=zudoku.config.ts
const config = {
  theme: {
    fonts: {
      sans: {
        url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
        fontFamily: "Roboto, sans-serif",
      },
      mono: {
        url: "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
        fontFamily: "Roboto Mono, monospace",
      },
    },
  },
};
```

## Local Fonts

To use local fonts, add them to the `public` folder and create a `fonts.css` file:

```css
@font-face {
  font-family: "CustomFont";
  font-style: normal;
  font-weight: 400;
  src: url("/custom-font-400.woff2") format("woff2");
}
```

Then reference the local CSS file:

```tsx title=zudoku.config.ts
const config = {
  theme: {
    fonts: {
      sans: {
        url: "/fonts.css",
        fontFamily: "CustomFont, sans-serif",
      },
    },
  },
};
```

## Mixed Configuration

You can mix predefined fonts with custom fonts:

```tsx title=zudoku.config.ts
const config = {
  theme: {
    fonts: {
      sans: "Inter", // Predefined Google Font
      serif: {
        // Custom font
        url: "/custom-serif.css",
        fontFamily: "CustomSerif, serif",
      },
      mono: "Fira Code", // Predefined Google Font
    },
  },
};
```
