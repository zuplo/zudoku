<div align=center>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/zudoku-logo-light.svg" width=630>
  <img alt="Zudoku Docs & Developer Portal" src="./assets/zudoku-logo-dark.svg" width=630>
</picture>

API documentation should always be **free**.
<p align="center">
  <a aria-label="Made with love by Zuplo" href="https://zuplo.com"><img src="https://img.shields.io/badge/made_with_❤️_by-zuplo-FF00BD"></a>
  <a aria-label="Zudoku Version" href="https://www.npmjs.com/package/zudoku"><img alt="" src="https://img.shields.io/npm/v/zudoku
  "></a>
  <a aria-label="Create Zudoku App Version" href="https://www.npmjs.com/package/create-zudoku-app"><img alt="" src="https://img.shields.io/npm/v/create-zudoku-app?label=cli
  "></a>
  <a aria-label="License" href="https://github.com/zuplo/zudoku/license.md"><img alt="" src="https://img.shields.io/badge/license-mit-green"></a>
</p>
</div>

# Introduction

**Zudoku** (pronounced "zoo-doh-koo") is an open-source, highly customizable API documentation framework for building quality developer experiences. 

Because building great API documentation should always be:

✅ Free<br />
✅ OpenAPI powered<br />
✅ Programmable


Zudoku can use both OpenAPI and GraphQL schemas and is extended via plugins that include features like static content, authentication, monetization, or anything else you can think of.

**Test Zudoku with your own API right now at [zudoku.dev](https://zudoku.dev).**

## Installation



## Use Cases

- Documentation
- API Documentation
  - OpenAPI Reference
  - GraphQL Reference
- Internal Documentation
- Developer Portal: Generate API Keys, Inspect Logs, etc.

  **or any combination of these**

## Features

- Static [MDX pages](https://mdxjs.com/) to document your things 📖
- Generates documentation based on single or multiple OpenAPI schemas <img src="https://emojis.slackmojis.com/emojis/images/1643514263/2320/graphql.png" height="18" />
  - OpenAPI 3.x, (working on OpenAPI 4)
  - Load spec from disk or URL
- Generates docs based on your GraphQL Schema <img src="https://emojis.slackmojis.com/emojis/images/1681900279/65279/openapi.png?1681900279" height="18" />
- Supports Authentication. Bring your users right into your docs
  - OpenID
  - OAuth2
- Integrated Playground with Authentication
- Fast & simple to run
- Highly composable with sensible defaults

## Roadmap

- ✅ OpenAPI Support
- ✅ Test Console
- ✅ Authentication
- ✅ MDX Support
- ✅ Static Page Support
- GraphQL Support

# Getting Started

We've made it easy to get started with Zudoku. You can use the CLI to generate a new project or use it as a React component.

## Start from template

```
npx create-zudoku-app@latest
```

## Using as Standalone

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="https://cdn.zudoku.dev/logos/icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zudoku Demo</title>
    <script type="module" crossorigin src="https://chdn.zudoku.dev/latest/main.js"></script>
    <link rel="stylesheet" crossorigin href="https://chdn.zudoku.dev/latest/style.css" />
  </head>
  <body>
    <div data-api-url="https://api.example.com/openapi.json"></div>
  </body>
</html>
```

# Contributing

## Run locally

To run the project locally, you can use the following commands:

```
pnpm install
pnpm dev
```
