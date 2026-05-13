# Zudoku + Cloudflare Workers SSR

Zudoku with server-side rendering on Cloudflare Workers.

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Configuration

`wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "zudoku-cloudflare-ssr",
  "main": "./dist/server/entry.js",
  "compatibility_date": "2025-04-01",
  // Required because the SSR bundle uses Node.js built-in modules
  "compatibility_flags": ["nodejs_compat"],

  // Prevents wrangler's esbuild from injecting __name helpers into functions.
  // Libraries like next-themes use Function.toString() to inline scripts into
  // HTML, and the __name calls break in the browser.
  "keep_names": false,
  "assets": {
    "directory": "./dist",
  },
}
```

## Build & Deploy

```bash
pnpm run deploy
```
