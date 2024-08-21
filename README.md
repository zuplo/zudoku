<div align=center>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/zudoku-logo-light.svg" width=630>
  <a href="https://zudoku.dev" alt="Zudoku"><img alt="Zudoku Docs & Developer Portal" src="./assets/zudoku-logo-dark.svg" width=630></a>
</picture>

<h2>API documentation should always be free.</h2>

[![MIT License](https://img.shields.io/badge/license-mit-green?style=for-the-badge)](https://github.com/zuplo/zudoku/license.md)
[![Zudoku Version](https://img.shields.io/npm/v/zudoku?style=for-the-badge)](https://www.npmjs.com/package/zudoku)
[![Create Zudoku App Version](https://img.shields.io/npm/v/create-zudoku-app?label=cli&style=for-the-badge)](https://www.npmjs.com/package/create-zudoku-app)
[![Made with love by Zuplo](https://img.shields.io/badge/made_with_❤️_by-zuplo-FF00BD?style=for-the-badge)](https://zuplo.com)

</div>

# Introduction

**Zudoku** (pronounced _"zoo-doh-koo"_) is an open-source, highly customizable API documentation framework for building quality developer experiences.

Because building great API documentation should always be:

✅ Free<br />
✅ OpenAPI powered<br />
✅ Programmable

Zudoku supports both OpenAPI and GraphQL schemas and is extended via plugins that include features like static content, authentication, monetization, or anything else you can think of.

## 🤩 Try it

**Test Zudoku with your own API now at [zudoku.dev](https://zudoku.dev)** and see how good your documentation can look!

## ⚙️ Installation

You can use the CLI to generate a new project or use it standalone as a React component.

### ⚡️ Quick start

Fire up your new API docs from out getting started template:

```
npx create-zudoku-app@latest
```

### 📦 Standalone via CDN

Add the package and styles to your `<head>` and pass the URL for your API schema to the `data-api-url` property, as shown here:

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

### 🧱 Getting started templates

To get started with some of the features Zudoku offers you can use one of these [example templates](https://github.com/zuplo/zudoku/tree/main/examples):

| Template                                                                                | What it does                                          |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [many-apis](https://github.com/zuplo/zudoku/tree/main/examples/many-apis)               | Using more than one OpenAPI document with Zudoku      |
| [with-auth0](https://github.com/zuplo/zudoku/tree/main/examples/with-auth0)             | Authenticate users in docs with the Auth0 plugin      |
| [with-config](https://github.com/zuplo/zudoku/tree/main/examples/with-config)           | Barebones config, ready for you to setup how you like |
| [with-vite-config](https://github.com/zuplo/zudoku/tree/main/examples/with-vite-config) | Use Zudoku with your Vite config (Advanced)           |

# ✨ Features

- <img src="https://avatars3.githubusercontent.com/u/16343502?v=3&s=200" width=16 height=16>&nbsp;</img>Generate documentation from a single or multiple [OpenAPI](https://swagger.io/specification/) schema
- <img src="https://raw.githubusercontent.com/graphql/graphql-playground/main/packages/graphql-playground-electron/static/icons/icon.ico" width=16 height=16>&nbsp;</img>Generate documentation based on [GraphQL](https://graphql.org/) schema
- 📄 Create static [MDX pages](https://mdxjs.com/) for anything you want to document
- 🔐 Integrate your users with authentication via OpenID or OAuth2
- 🧪 Let users test their API calls using the Integrated Playground (includes authentication!)
- 🌑 Dark mode (of course!)

Zudoku is quick to implement, easy to configure and is highly composable with sensible defaults.

## Zudoku use cases

Zudoku is a flexible and highly customizable framework so it can be used to create many things, including:

- Standalone documentation websites
- OpenAPI or GraphQL schema powered API documentation
- A developer portal with combined documentation and fully function API reference with authentication, testing and support for your user accounts.
- Internal documentation

# 🎓 Examples

- [Rick & Morty API](https://zudoku.zuplopreview.net/demo?api-url=https://rickandmorty.zuplo.io/openapi.json)
- [Zuplo API Documentation](https://docs-zudoku.pages.dev/)

# 🎯 Motivation

At Zuplo, we couldn’t find an open-source solution that met our high standards for both trustworthiness and programmability, so we decided to create our own. And since no one chooses Zuplo solely because of our documentation, we felt great about open-sourcing this tool and making it easy to self-host.

We hope that if you use it, you’ll think fondly of Zuplo, and one day, when you’re looking for a gateway or API management product, you’ll consider us as a vendor to evaluate.

Zudoku will always be open-source. It will always be free.

# 🔧 Contributing

Contributions are absolutely welcome! You can start contributing by cloning this repository and running:

```
pnpm install
pnpm dev
```

## Prerequisites

To work develop and contribute to Zudoku you will need:

- [Node.js](https://nodejs.org/) >= v20.0.0
- [Git](https://git-scm.com/)
- [pnpm](https://pnpm.io/installation)

More detail on the process for contributing can be found in the [contributing guide](CONTRIBUTING.md).

# Changelog

Details of the latest updates to Zudoku can be found in the [changelog](CHANGELOG.md).

# License

Zudoku is licensed under MIT. See the full [LICENSE.md].
