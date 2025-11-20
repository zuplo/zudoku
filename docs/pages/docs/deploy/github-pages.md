---
title: GitHub Pages
zuplo: false
---

[GitHub Pages](https://pages.github.com/) is a great way to publish your documentation, especially
if you are using GitHub for source control.

## Prerequisites

To publish your site to GitHub Pages you will need:

- A GitHub account

## Deploying to GitHub Pages

Use the
[GitHub Actions Workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).

You might need to configure the `basePath` in your zudoku.config.ts depending on how your site is
hosted. For instance, if your site is available at username.github.io/your-repo/ you would set the
`basePath` to `/your-repo`.

```typescript
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  basePath: "/your-repo",
  //...
};
```

## Accurate Last Modified Dates

If you have enabled the [`showLastModified`](/docs/configuration/docs#showlastmodified) option,
Zudoku automatically tracks the last modified date of your documentation pages using Git history.
However, GitHub Actions performs shallow clones by default, which can result in inaccurate "Last
Modified" dates for pages that haven't been updated recently.

To ensure accurate last modified dates, configure the `actions/checkout` step to fetch the full
history:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0 # Fetch all history for all branches and tags
```

For more details, see the
[actions/checkout documentation](https://github.com/actions/checkout#fetch-all-history-for-all-tags-and-branches).
