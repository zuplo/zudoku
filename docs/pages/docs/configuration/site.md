---
sidebar_label: Branding & Layout
sidebar_icon: layout-dashboard
description:
  Customize your Zudoku site's branding, logo, banner, and layout options with detailed
  configuration examples and guidance.
---

# Branding & Layout

We offer you to customize the main aspects of your Zudoku site's appearance and behavior.

## Branding

**Title**, **logo** can be configured in under the `site` property:

```tsx title=zudoku.config.tsx
const config = {
  site: {
    title: "My API Documentation",
    logo: {
      src: {
        light: "/path/to/light-logo.png",
        dark: "/path/to/dark-logo.png",
      },
      alt: "Company Logo",
      href: "/",
    },
    // Other options...
  },
};
```

### Available Options

#### Title

Set the title of your site next to the logo in the header:

```tsx title=zudoku.config.tsx
{
  site: {
    title: "My API Documentation",
  }
}
```

#### Logo

Configure the site's logo with different versions for light and dark themes:

```tsx title=zudoku.config.tsx
{
  site: {
    logo: {
      src: {
        light: "/light-logo.png",
        dark: "/dark-logo.png"
      },
      alt: "Company Logo",
      width: "120px", // optional width
      href: "/", // optional link target (defaults to "/")
      reloadDocument: true, // optional, defaults to true
    }
  }
}
```

The `reloadDocument` option controls whether clicking the logo triggers a full page reload (`true`,
the default) or uses client-side SPA navigation (`false`). A full reload is useful when your landing
page is served by a different system (e.g. a CMS) outside of Zudoku.

#### Direction (RTL/LTR)

Set the text direction for your site. This is useful for right-to-left languages:

```tsx title=zudoku.config.tsx
{
  site: {
    dir: "rtl", // "ltr" (default) or "rtl"
  }
}
```

#### Colors & Theme

We allow you to fully customize all colors, borders, etc - read more about it in
[Colors & Themes](/docs/customization/colors-theme)

#### Custom 404 Page

Replace the default "Page not found" page with your own component using the `notFoundPage` option:

```tsx title=zudoku.config.tsx
import { NotFound } from "./src/NotFound";

const config = {
  site: {
    notFoundPage: <NotFound />,
  },
};
```

Your component will be rendered whenever a user navigates to a route that doesn't exist. This works
in both development and production builds.

Here's an example of a custom 404 component:

```tsx title=src/NotFound.tsx
import { Button, Link } from "zudoku/components";

export const NotFound = () => (
  <section className="flex items-center justify-center py-20">
    <div className="text-center max-w-lg mx-auto">
      <p className="text-6xl font-extrabold text-primary mb-4">404</p>
      <h1 className="text-3xl font-bold mb-4">Page not found</h1>
      <p className="text-muted-foreground mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/">Go back home</Link>
      </Button>
    </div>
  </section>
);
```

## Layout

### Banner

Add a banner message to the top of the page:

```tsx title=zudoku.config.tsx
{
  site: {
    banner: {
      message: "Welcome to our beta documentation!",
      color: "info", // "note" | "tip" | "info" | "caution" | "danger" or custom
      dismissible: true
    }
  }
}
```

### Footer

The footer configuration has its own dedicated section. See the [Footer Configuration](./footer) for
details.

## Complete Example

Here's a comprehensive example showing all available page configuration options:

```tsx title=zudoku.config.tsx
{
  site: {
    title: "My API Documentation",
    logo: {
      src: {
        light: "/images/logo-light.svg",
        dark: "/images/logo-dark.svg"
      },
      alt: "Company Logo",
      width: "100px",
    },
    notFoundPage: <NotFound />,
    banner: {
      message: "Welcome to our documentation!",
      color: "info",
      dismissible: true
    },
  }
}
```
