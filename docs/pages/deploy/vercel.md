---
title: Vercel
---

[Vercel](https://vercel.com) offers multiple ways to deploy to its service, including via GitHub, and their CLI. You can read more about them in their [Deployments Overview](https://vercel.com/docs/deployments/overview).

## Prerequisites

To deploy to Vercel you will need:

- A Vercel account (free)
- A GitHub account (if deploying via GitHub)
- The Vercel CLI

Deploying your Zudoku powered documentation using the Vercel CLI is what we will cover in this guide.

## Install the CLI

To get started you need to install the CLI:

```command
npm i -g vercel
```

## Setup a new project

Next, set up a new Vercel project in the root of your docs:

```command
vercel
```

This command will set up everything that is needed to deploy your documentation to Vercel.

It will ask some specific questions including the project name and where the code is located. You can answer however you like for these.

When you get to this step:

```bash
No framework detected. Default Project Settings:
- Build Command: `npm run vercel-build` or `npm run build`
- Development Command: None
- Install Command: `yarn install`, `pnpm install`, `npm install`, or `bun install`
- Output Directory: `public` if it exists, or `.`
? Want to modify these settings? (y/N)
```

Answer _Yes_ and select to modify the Output Directory.

By default Vercel looks for a directory named `public`, but the Zudoku build will be found in `dist`. Set the output directory like this:

```bash
? What's your Output Directory? ./dist
```

After this is complete, your site will build and Vercel will respond with the URL for you to test it.

:::tip{title="Clean URLs"}

You will almost certainly want to enable clean URLs for your site. This will remove the `.html` extension from your URLs. You can do this by adding a `cleanUrls` property to your `vercel.json` file. See the [Vercel Configuration](https://vercel.com/docs/projects/project-configuration#cleanurls) for more information.

:::

:::caution{title="Redirects"}

If you have redirects configured in your Zuplo configuration, you will need to also add those to your `vercel.json` file. See the [Vercel Configuration](https://vercel.com/docs/projects/project-configuration#redirects) for more information.

This is a current limitation. See [#115](https://github.com/zuplo/zudoku/issues/151).

:::
