---
sidebar_label: Page
sidebar_icon: layout-dashboard
---

# Page Configuration

The page configuration allows you to customize the main aspects of your Zudoku site's appearance and behavior.

## Basic Configuration

Configure the page settings in your `zudoku.config.tsx` file under the `page` property:

```tsx
const config: ZudokuConfig = {
  page: {
    pageTitle: "My API Documentation",
    logo: {
      src: {
        light: "/path/to/light-logo.png",
        dark: "/path/to/dark-logo.png",
      },
      alt: "Company Logo",
    },
    // Other options...
  },
};
```

## Available Options

### Page Title

Set the title of your site next to the logo in the header:

```tsx
page: {
  pageTitle: "My API Documentation";
}
```

### Logo

Configure the site's logo with different versions for light and dark themes:

```tsx
page: {
  logo: {
    src: {
      light: "/light-logo.png",
      dark: "/dark-logo.png"
    },
    alt: "Company Logo",
    width: "120px" // optional width
  }
}
```

### Banner

Add a banner message to the top of the page:

```tsx
page: {
  banner: {
    message: "Welcome to our beta documentation!",
    color: "info", // "note" | "tip" | "info" | "caution" | "danger" or custom
    dismissible: true
  }
}
```

### Footer

The footer configuration has its own dedicated section. See the [Footer Configuration](./footer) page for details.

## Complete Example

Here's a comprehensive example showing all available page configuration options:

```tsx
page: {
  pageTitle: "My API Documentation",
  logo: {
    src: {
      light: "/images/logo-light.svg",
      dark: "/images/logo-dark.svg"
    },
    alt: "Company Logo",
    width: "100px"
  },
  banner: {
    message: "Welcome to our documentation!",
    color: "info",
    dismissible: true
  },
}
```
