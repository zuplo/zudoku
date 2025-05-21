---
title: Custom pages
sidebar_icon: layers-3
---

If you want to include pages in your documentation that have greater flexibility than MDX pages, it is possible to include custom pages of your own.

These pages are typically built using standard React markup and can borrow from a set of prebuild components that Zudoku already has such as buttons, links and headers.

Start by creating the page you want to add.

## Setup a custom page

Each custom page is a page component of its own and live in a `src` directory at the root of your project. Let's create the `<MyCustomPage />` component as an example.

From the root of your project run this command:

```command
touch src/MyCustomPage.tsx
```

You can now open `/src/MyCustomPage.tsx` in the editor of your choice. It will be empty.

Copy and paste this code to implement the page:

```tsx
import { Button, Head, Link } from "zudoku/components";

export const MyCustomPage = () => {
  return (
    <section className="">
      <Head>
        <title>My Custom Page</title>
      </Head>
      <div>
        <p>Welcome to MyCustomPage</p>
      </div>
    </section>
  );
};
```

## Configuration

In the [Zudoku Configuration](../configuration/overview.md) you will need to do the following:

### Change Your Config Extension

In order to embed `jsx`/`tsx` components into your Zudoku config, you will need to change your file extension from `ts` to `tsx` (or `js` to `jsx` if not using TypeScript).

```fs
zudoku.config.ts -> zudoku.config.tsx
```

### Import Your Module

Import the `<MyCustomPage />` component that you created.

```typescript
import { MyCustomPage } from "./src/MyCustomPage";
```

### Add The `customPages` Config

Add the `customPages` option to the configuration. Each page you want to add to the site must be its own object.

The `path` key can be set to whatever you like. This will appear as part of the URL in the address bar of the browser.

The `element` key references the name of the custom page component that you want to load.

```typescript
{
  // ...
  customPages: [
    {
      path: "/a-custom-page",
      element: <MyCustomPage />,
    },
  ]
  // ...
}
```

This configuration will allow Zudoku to load the contents of the `<MyCustomPage />` component when a user clinks on a link that points to `/a-custom-page`.

## Troubleshooting

### Updating Your `tsconfig.json`

Your `include` property in `tsconfig.json` should automatically be updated to reflect the new custom pages, but in case it isn't, it should look like this:

```json
{
  ...
  "include": ["src", "zudoku.config.tsx", "src/MyCustomPage.tsx"]
}
```
