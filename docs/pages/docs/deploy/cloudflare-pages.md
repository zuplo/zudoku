---
title: Cloudflare Pages
---

[Pages](https://developers.cloudflare.com/pages) is a low configuration way of publishing your documentation.

## Prerequisites

To publish your site to Cloudflare Pages you will need:

- A Cloudflare account

Optionally, you may also need:

- A GitHub or GitLab account (optional)

## Deploying to Pages

Cloudflare offers three different ways to create Pages sites.

1. Using the [Cloudflare CLI](https://developers.cloudflare.com/pages/get-started/c3/)
2. Directly uploading the files using [drag and drop](https://developers.cloudflare.com/pages/get-started/direct-upload/#drag-and-drop), or their [Wrangler CLI](https://developers.cloudflare.com/pages/get-started/direct-upload/#wrangler-cli)
3. Integration with [GitHub or GitLab](https://developers.cloudflare.com/pages/get-started/git-integration/)

It's up to you which approach you choose but the fastest approach is to use the Wrangler CLI.

## Deploy using Wrangler

Wrangler makes light work of deploying to Cloudflare Pages, but first you need to get your files in order.

Build the static version of your documentation site by running:

```command
npm run build
```

This will generate a new folder called `dist` that contains all the files that you need to deploy.

Next, if you don't already have one, create a new Pages project:

```command
npx wrangler pages project create
```

Finally, deploy the files to the new project:

```command
npx wrangler pages deploy ./dist
```

Within a few seconds the site will be live and viewable at `<your-project-name>.pages.dev`.
