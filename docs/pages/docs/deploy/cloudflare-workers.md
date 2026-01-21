---
title: Cloudflare Workers (SSR)
---

Deploy Zudoku as a server-rendered application on Cloudflare Workers.

## Build

```bash
npx zudoku build --ssr --adapter cloudflare
```

## Deploy with Wrangler

1. Create `wrangler.toml`:

```toml
name = "my-docs"
main = "dist/server/entry.js"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
```

2. Deploy:

```bash
npx wrangler deploy
```
