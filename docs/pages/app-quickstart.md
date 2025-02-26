---
title: App Quickstart
description: Get started with Zudoku by creating a new Zudoku app using the `create-zudoku-app` tool.
sidebar_icon: app-window-mac
---

The recommended way to get started with Zudoku is to use the `create-zudoku-app` CLI tool. This tool will scaffold a new Zudoku site for you to customize and build upon.

# Prerequisites

You will need [Node.js](https://nodejs.org/) installed to use the CLI. Zudoku requires Node.js version 22 or higher.

## Install Zudoku

### Windows

1. Open your terminal (Command Prompt or PowerShell).
2. Run the following command to create a new Zudoku app:

```bash
npx create-zudoku-app
```

#### MacOS

1. Open your terminal (you can use the built-in Terminal app).
2. Run the following command to create a new Zudoku app:

```bash
npx create-zudoku-app
```

#### Linux

1. Open your terminal (you can use the built-in Terminal app).
2. Run the following command to create a new Zudoku app:

```bash
npx create-zudoku-app
```

The generator will take you through the setup steps and scaffold a minimal but fully functional documentation site for you to get started with.

2. Open the newly created project in your code editor. You will find and example OpenAPI file in `/apis/openapi.yaml`. Replace this file with your own OpenAPI schema.

:::tip{title="JSON OpenAPI Files"}

If your OpenAPI file is in JSON format you can create an `openapi.json`. Set the file path in the `zudoku.config.ts` to point to your JSON file.

:::

3. Start the development server by running

```bash
npm run dev
```

You now have a fully functional Zudoku site running on your local machine. Next, commit your changes to a source repository and [deploy the site](./deployment.md) to your hosting provider or CDN.
