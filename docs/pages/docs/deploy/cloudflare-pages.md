---
title: Cloudflare Pages
zuplo: false
---

[Pages](https://developers.cloudflare.com/pages) is a low configuration way of publishing your
documentation.

## Prerequisites

To publish your site to Cloudflare Pages you will need:

- A Cloudflare account

Optionally, you may also need:

- A GitHub or GitLab account (optional)

## Deploying to Pages

Cloudflare offers three different ways to create Pages sites.

1. Using the [Cloudflare CLI](https://developers.cloudflare.com/pages/get-started/c3/)
2. Directly uploading the files using
   [drag and drop](https://developers.cloudflare.com/pages/get-started/direct-upload/#drag-and-drop),
   or their
   [Wrangler CLI](https://developers.cloudflare.com/pages/get-started/direct-upload/#wrangler-cli)
3. Integration with
   [GitHub or GitLab](https://developers.cloudflare.com/pages/get-started/git-integration/)

It's up to you which approach you choose but the fastest approach is to use the Wrangler CLI.

## Deploy using Wrangler

Wrangler makes light work of deploying to Cloudflare Pages, but first you need to get your files in
order.

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

## Accurate Last Modified Dates

If you have enabled the [`showLastModified`](/docs/configuration/docs#showlastmodified) option,
Zudoku automatically tracks the last modified date of your documentation pages using Git history.
However, Cloudflare Pages performs shallow clones by default, which can result in inaccurate "Last
Modified" dates for pages that haven't been updated recently.

To ensure accurate last modified dates when using Git integration with Cloudflare Pages, modify your
build command to fetch the full history before building:

```bash
git fetch --unshallow && npm run build
```

This command converts the shallow clone to a full clone before running your build, ensuring all
pages show their correct last modified dates.
