---
title: Deploying Zudoku
zuplo: false
---

Once you are happy with your Zudoku powered documentation and ready to push your docs to production
you will need to deploy it to your own server, or a hosted service of your choice.

## SSG vs SSR

Zudoku supports two rendering modes:

- **SSG (Static Site Generation)**: Pre-renders all pages at build time, outputs static HTML. This
  is the default and works with any static hosting.
- **SSR (Server-Side Rendering)**: Renders pages on-demand. Requires a server runtime but enables
  dynamic content and faster builds for large sites.

## Build locally

### Static (SSG)

Zudoku can produce a build of static HTML, JavaScript and CSS files that you can deploy directly to
your own server.

To prepare the files you need to upload to your server, you will need to use the build command.

```
npm run build
```

Once complete, you will see a new `dist` folder in the root of your project that includes the files
you need to upload.

### Server (SSR)

To build for SSR, use the `--ssr` flag with an optional adapter:

```
npx zudoku build --ssr                    # Node.js (default)
npx zudoku build --ssr --adapter vercel   # Vercel Edge
npx zudoku build --ssr --adapter cloudflare # Cloudflare Workers
```

This produces:

- `dist/` - Static assets (JS, CSS, images)
- `dist/server/entry.js` - Server entry point

See the deployment guides below for platform-specific instructions.
