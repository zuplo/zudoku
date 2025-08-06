---
title: GitHub Pages
---

[GitHub Pages](https://pages.github.com/) is a great way to publish your documentation, especially if you are using GitHub for source control.

## Prerequisites

To publish your site to GitHub Pages you will need:

- A GitHub account

## Deploying to GitHub Pages

Use the [GitHub Actions Workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).

You might need to configure the `basePath` in your zudoku.config.ts depending on how your site is hosted. For instance, if your site is available at username.github.io/your-repo/ you would set the `basePath` to `/your-repo`.

```typescript
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  basePath: "/your-repo",
  //...
};
```
