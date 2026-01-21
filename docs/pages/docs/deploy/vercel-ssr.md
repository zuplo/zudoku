---
title: Vercel (SSR)
---

Deploy Zudoku as a server-rendered application on Vercel Edge.

## When to use SSR

- Dynamic content that changes frequently
- User-specific pages
- Large sites where pre-rendering all pages is slow

## Build

```bash
npx zudoku build --ssr --adapter vercel
```

This generates the [Vercel Build Output API](https://vercel.com/docs/build-output-api/v3) structure
automatically in `.vercel/output/`.

## Deploy

Push to your Git repository connected to Vercel, or deploy directly:

```bash
vercel --prebuilt
```

The `--prebuilt` flag tells Vercel to use the pre-generated `.vercel/output/` directory.
