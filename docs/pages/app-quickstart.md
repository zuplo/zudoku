---
title: App Quickstart
description: Get started with Zudoku by creating a new Zudoku app using the `create-zudoku-app` tool.
sidebar_icon: app-window-mac
---

The recommended way to get started with Zudoku is to use the `create-zudoku-app` CLI tool. This tool will scaffold a new Zudoku site for you to customize and build upon.

# Prerequisites

- [Node.js](https://nodejs.org/) version 22 or higher

# Getting Started

1. Create a new Zudoku app by running:

```bash
npm create zudoku-app@latest
```

2. Open the project in your code editor and replace the example OpenAPI file at `/apis/openapi.yaml` with your own OpenAPI schema.

:::tip

You can use `openapi.json` instead of YAML. Just update the file path in `zudoku.config.ts`.

:::

3. Start the development server:

```bash
npm run dev
```

Your Zudoku site is now running locally! Next, commit your changes and [deploy the site](./deployment.md) to your preferred hosting provider.
