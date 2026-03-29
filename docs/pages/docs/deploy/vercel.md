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

Answer _Yes_ and select to modify the Output Directory.

By default Vercel looks for a directory named `public`, but the Zudoku build will be found in
`dist`. Set the output directory like this:

```ansi
? What's your Output Directory? dist
```

After this is complete, your site will build and Vercel will respond with the URL for you to test
it.

:::tip{title="Clean URLs and Redirects"}

Zudoku automatically generates Vercel Build Output API v3 configuration that includes:

- **Clean URLs**: All `.html` files are automatically accessible without the `.html` extension
  (e.g., `/documentation` instead of `/documentation.html`)
- **Redirects**: Any redirects configured in your Zudoku configuration are automatically applied

No additional configuration in `vercel.json` is required for these features to work.

:::

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
