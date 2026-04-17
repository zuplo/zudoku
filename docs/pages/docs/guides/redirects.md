---
title: Redirects
sidebar_icon: arrow-right-left
description:
  Configure URL redirects in your Zudoku developer portal to set landing pages, maintain backward
  compatibility, and handle URL changes. Covers redirect behavior, basePath interaction, and
  troubleshooting.
---

Redirects let you automatically send visitors from one URL to another in your developer portal. They
are useful when you need to:

- Set a custom landing page for the root path (`/`)
- Maintain backward compatibility after restructuring documentation
- Point old API endpoint paths to their new locations
- Redirect from deprecated pages to their replacements

## Basic configuration

Add a `redirects` array to your `zudoku.config.ts` file. Each entry has a `from` path and a `to`
path:

```ts title="zudoku.config.ts"
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  // ... other config
  redirects: [
    { from: "/", to: "/docs/introduction" },
    { from: "/getting-started", to: "/docs/quickstart" },
  ],
};

export default config;
```

When a visitor navigates to the `from` path, they are automatically redirected to the `to` path.

## Redirect properties

Each redirect object accepts two properties:

- **`from`** — The path you want to redirect away from. This should be an absolute path starting
  with `/`.
- **`to`** — The destination path where visitors will be sent. This can be any valid path in your
  portal.

```ts
redirects: [{ from: "/old-page", to: "/new-page" }];
```

Trailing slashes in the `from` path are normalized automatically. Both `/old-page` and `/old-page/`
will match the same redirect rule.

## How redirects work

Zudoku redirects operate at two levels depending on how the visitor reaches the page:

### Server-side behavior

When a visitor loads a redirect path directly (for example, by typing the URL in the browser address
bar or following an external link), the exact response depends on your deployment target:

- **Zuplo** and **Vercel** (or any platform that reads the Vercel Build Output API): the platform
  returns an HTTP **301 (Moved Permanently)** with a `Location` header, so browsers and search
  engines see a true permanent redirect.
- **SSR deployments**: the server returns a real HTTP 301 from the router loader.
- **Other static hosts** (Netlify, Cloudflare Pages, GitHub Pages, S3, nginx, etc.): Zudoku
  prerenders each redirect source path as a small HTML file containing a JavaScript redirect. The
  file is served with a 200 response and the browser follows the redirect once the script runs.
  JavaScript must be enabled for the redirect to fire.

### Client-side behavior

When a visitor clicks an internal link that points to a redirect path, Zudoku handles the redirect
entirely in the browser using client-side routing. The visitor is navigated to the destination
without a full page reload, providing a seamless experience.

Both behaviors land the visitor on the destination page. For search engines, only the 301 variants
signal a permanent move; the JavaScript redirect used on generic static hosts is weaker for SEO.

## Common patterns

### Setting a landing page

The most common use of redirects is setting a landing page for the root path of your portal:

```ts
redirects: [{ from: "/", to: "/docs/introduction" }];
```

This sends visitors who arrive at your portal's root URL to your introduction page.

### Reorganizing documentation

When you restructure your documentation, add redirects from the old paths so existing bookmarks and
external links continue to work:

```ts
redirects: [
  { from: "/api/authentication", to: "/guides/auth-overview" },
  { from: "/api/getting-started", to: "/docs/quickstart" },
  { from: "/reference", to: "/api" },
];
```

### Redirecting to specific sections

You can redirect to a specific section of a page using a hash fragment in the `to` path:

```ts
redirects: [
  {
    from: "/api-shipments/create-shipment",
    to: "/api-shipments/shipment-management#post-shipments",
  },
  {
    from: "/api-shipments/get-rates",
    to: "/api-shipments/rates-and-billing#post-shipments-shipmentid-rates",
  },
];
```

This is useful when multiple old pages have been consolidated into a single page with distinct
sections.

### Redirecting category paths

If your API reference groups endpoints into categories, you may want the category path to redirect
to a specific endpoint or overview page:

```ts
redirects: [
  { from: "/api/billing", to: "/api/billing/get-invoices" },
  { from: "/api/users", to: "/api/users/list-users" },
];
```

## Redirects and the `basePath` option

If your portal uses a [`basePath`](/docs/configuration/overview#basepath), redirects are defined
_relative to the base path_. Zudoku automatically prepends the base path to both the matched `from`
and the emitted `Location`.

For example, with `basePath: "/docs"`:

```ts
redirects: [{ from: "/", to: "/getting-started" }];
// Visitors to /docs/ are redirected to /docs/getting-started
```

You do not need to include the base path in your `from` or `to` values.

## Redirects vs. navigation rules

Zudoku offers two features that can change where visitors end up: [redirects](#basic-configuration)
and [navigation rules](/docs/guides/navigation-rules). They serve different purposes:

- **Redirects** map one URL to another. Use them when a page has moved or when you need a specific
  URL to point somewhere else. They affect both direct visits and internal link clicks.
- **Navigation rules** customize the _sidebar_ generated by plugins like the OpenAPI plugin. Use
  them to insert, reorder, modify, or remove items in the sidebar without changing the underlying
  page URLs.

If you want to change where a URL takes visitors, use a redirect. If you want to change what appears
in the sidebar navigation, use a navigation rule.

## Redirects and sitemaps

Redirect source paths are automatically excluded from your
[sitemap](/docs/configuration/overview#sitemap). Only the destination pages appear in the generated
`sitemap.xml`, which prevents search engines from indexing the old URLs.

## Troubleshooting

### Redirect returns a 404

Make sure the `to` path points to a page that actually exists in your portal. If the destination is
an API reference page generated from an OpenAPI spec, verify that the path matches the generated
route. You can check available routes by running your dev server and navigating manually.

### Redirect conflicts with another route

Redirects are registered before page routes, so when a redirect `from` path exactly matches another
route, the redirect wins. If you want a page to be reachable at a given path, remove the conflicting
redirect rather than relying on route priority.
