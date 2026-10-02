---
title: Vercel
zuplo: false
---

[Vercel](https://vercel.com) offers multiple ways to deploy to its service, including via GitHub,
and their CLI. You can read more about them in their
[Deployments Overview](https://vercel.com/docs/deployments/overview).

## Prerequisites

To deploy to Vercel you will need:

- A Vercel account (free)
- A GitHub account (if deploying via GitHub)
- The Vercel CLI

Deploying your Zudoku powered documentation using the Vercel CLI is what we will cover in this
guide.

## Install the CLI

To get started you need to install the CLI:

```bash
npm i -g vercel
```

## Setup a new project

Next, set up a new Vercel project in the root of your docs:

```bash
vercel
```

This command will set up everything that is needed to deploy your documentation to Vercel.

It will ask some specific questions including the project name and where the code is located. You
can answer however you like for these.

When you get to this step:

```ansi
No framework detected. Default Project Settings:
- Build Command: `npm run vercel-build` or `npm run build`
- Development Command: None
- Install Command: `yarn install`, `pnpm install`, `npm install`, or `bun install`
- Output Directory: `public` if it exists, or `.`
? Want to modify these settings? (y/N)
```

You can accept these defaults as long as the Output Directory override remains disabled. Do not set
it to `dist`, `public`, or another directory. When Vercel runs the build, Zudoku detects the
`VERCEL` environment variable and emits a
[Build Output API](https://vercel.com/docs/build-output-api) deployment to `.vercel/output`. Vercel
detects and deploys this directory automatically.

If your project already has an Output Directory saved in Vercel, disable the override in Project
Settings or add a `vercel.json` file at the project root. A minimal configuration is:

```json title="vercel.json"
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "buildCommand": "npm run build",
  "outputDirectory": null
}
```

The `framework: null` setting selects Vercel's **Other** framework preset. Adjust the build command
if your project uses a different script.

After this is complete, your site will build and Vercel will respond with the URL for you to test
it.

## Generated Vercel output

For a standard static build, Zudoku writes the following directly into `.vercel/output`:

- Static pages and assets under `.vercel/output/static`
- Clean URL routes and overrides, including redirects from your Zudoku configuration
- Vercel Routing Middleware for Markdown content negotiation when it is enabled

You do not need to add `cleanUrls`, copy Zudoku redirects, or define the generated middleware in
`vercel.json`. To inspect the same artifact locally, use `vercel build`; a plain `npm run build`
outside Vercel produces the portable `dist` output instead.

### Markdown content negotiation

[`publishMarkdown`](/docs/configuration/docs#publishmarkdown) is enabled by default, and
[`contentNegotiation`](/docs/configuration/docs#contentnegotiation) defaults to the same value. When
both are enabled, Zudoku's generated Routing Middleware:

- Serves Markdown from a canonical documentation URL when a `GET` or `HEAD` request prefers
  `text/markdown`
- Honors media-range specificity and `q` values, returning `406 Not Acceptable` when neither HTML
  nor Markdown is acceptable
- Includes `Vary: Accept, Accept-Encoding` so Vercel's cache keeps HTML and Markdown separate
- Advertises the `.md` representation with a `Link` header
- Preserves real `404` responses with a short Markdown recovery body
- Passes assets, published API schemas, and non-document routes through unchanged

Set `contentNegotiation: false` to disable the middleware while continuing to publish the explicit
`.md` files.

After deployment, verify a known page and a missing Markdown path:

```bash
curl -sS -D - -o /dev/null \
  -H 'Accept: text/markdown' \
  https://docs.example.com/quickstart

curl -sS -D - -o /dev/null \
  -H 'Accept: text/markdown' \
  https://docs.example.com/path-that-does-not-exist

curl -sS -D - -o /dev/null \
  -H 'Accept: application/json' \
  https://docs.example.com/quickstart
```

The first response should be `200` with `Content-Type: text/markdown; charset=utf-8` and a `Vary`
header containing both `Accept` and `Accept-Encoding`. The missing path should return `404` with a
Markdown content type; missing explicit `.md` and `.mdx` paths should do the same. The final request
should return `406`. If the first request returns HTML, confirm that Vercel deployed
`.vercel/output` and that no Output Directory override points to `dist`.

## Accurate Last Modified Dates

If you have enabled the [`showLastModified`](/docs/configuration/docs#showlastmodified) option,
Zudoku automatically tracks the last modified date of your documentation pages using Git history.
However, Vercel performs shallow clones by default (only fetching the last 10 commits), which can
result in inaccurate "Last Modified" dates for pages that haven't been updated recently.

To ensure accurate last modified dates, add the `VERCEL_DEEP_CLONE` environment variable to your
Vercel project:

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add a new variable: `VERCEL_DEEP_CLONE=true`
4. Save and redeploy your site

This will enable full Git history during builds, ensuring all pages show their correct last modified
dates. The impact on build time is minimal (typically 5-20 seconds on the first build), and
subsequent builds benefit from caching.
