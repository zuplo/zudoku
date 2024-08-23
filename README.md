<div align=center>

<a href="https://zudoku.dev" alt="Zudoku">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/zudoku-logo-light.svg" width=630>
    <img alt="Zudoku Docs & Developer Portal" src="./assets/zudoku-logo-dark.svg" width=630>
  </picture>
</a>

## API documentation should always be free.

[![MIT License](https://img.shields.io/badge/license-mit-green?style=for-the-badge&labelColor=000000)](https://github.com/zuplo/zudoku/license.md)
[![Zudoku Version](https://img.shields.io/npm/v/zudoku.svg?style=for-the-badge&labelColor=000000)](https://www.npmjs.com/package/zudoku)
[![Create Zudoku App Version](https://img.shields.io/npm/v/create-zudoku-app?label=cli&style=for-the-badge&labelColor=000000)](https://www.npmjs.com/package/create-zudoku-app)
[![Made with love by Zuplo](https://img.shields.io/badge/MADE%20BY%20Zuplo-FF00BD.svg?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAzNyAzMiIgYXJpYS1oaWRkZW49InRydWUiPgogIDxwYXRoIGZpbGw9IiNGRjAwQkQiIGQ9Ik0yNy4xNDIgMTkuOTc4SDE2LjYyTDI3LjgzIDguNzQ2YS43NTguNzU4IDAgMDAtLjUzNC0xLjI5M0g5LjQ4OFYwaDE5LjUzNGE3LjU3MyA3LjU3MyAwIDAxNC4wNjUgMS4xMjUgNy41OTEgNy41OTEgMCAwMTIuODM2IDMuMTI2IDcuNDAyIDcuNDAyIDAgMDEtMS40NjEgOC4zOThsLTcuMzIgNy4zMjh6Ii8+CiAgPHBhdGggZmlsbD0iI0ZGMDBCRCIgZD0iTTkuNDg5IDExLjA0MmgxMC41MjRsLTExLjE5IDExLjIxYS43NzIuNzcyIDAgMDAuNTQzIDEuMzE2aDE3Ljc1OXY3LjQ1Mkg3LjYxYTcuNTc0IDcuNTc0IDAgMDEtNC4wNjUtMS4xMjVBNy41OTMgNy41OTMgMCAwMS43MSAyNi43NjhhNy40MDMgNy40MDMgMCAwMTEuNDYyLTguMzk3bDcuMzE4LTcuMzI5eiIvPgo8L3N2Zz4K&labelColor=000)](https://zuplo.com)
[![Join the community on Discord](https://img.shields.io/badge/Chat%20on%20discord-5865F2.svg?style=for-the-badge&logo=discord&labelColor=000000&logoWidth=20)](https://discord.com/channels/848913990360629268/1235294876778627246)

</div>

<div align="center">
  <a href="https://twitter.com/zuplo">
    <img alt="X (formerly Twitter) Follow" src="https://img.shields.io/twitter/follow/zuplo">
  </a>
  <p align="center">
    <a href="#-try-it-right-now"><strong>Try Zudoku</strong></a> · 
    <a href="#-installation"><strong>Installation</strong></a> · 
    <a href="#-examples"><strong>Examples</strong></a> · 
    <a href="#-contributing"><strong>Contributing</strong></a> · 
    <a href="#-motivation"><strong>Motivation</strong></a>
  </p>
</div>

## Introduction

**Zudoku** (pronounced _"zoo-doh-koo"_) is an open-source, highly customizable API documentation framework for building quality developer experiences.

Because great API documentation frameworks should always be:

✅ Free<br />
✅ OpenAPI powered<br />
✅ Extensible<br />
✅ Low barrier to entry<br />
✅ Easy to maintain

## 🤩 Try it, right now!

**Test Zudoku with your own API now at [zudoku.dev](https://zudoku.dev)** and see how good your documentation can look!

## ✨ Features

- 🚀 Generate documentation from a single or multiple [OpenAPI](https://swagger.io/specification/) schema
- 📄 Create static [MDX pages](https://mdxjs.com/) for anything you want to document
- 🔐 Integrate your users with authentication via OpenID or OAuth2
- 🧪 Let users test their API calls using the Integrated Playground (includes authentication!)
- 🌑 Dark mode (of course!)

Zudoku is quick to implement, easy to configure and is highly composable with sensible defaults.

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

## 🎓 Examples

- [Rick & Morty API](https://zudoku.zuplopreview.net/demo?api-url=https://rickandmorty.zuplo.io/openapi.json)
- [Zuplo API Documentation](https://docs-zudoku.pages.dev/)

### Zudoku use cases

Because Zudoku is a flexible and highly customizable framework so it can be used to create many things, including:

- Standalone documentation websites
- OpenAPI or GraphQL schema powered API documentation
- A developer portal with combined documentation and fully function API reference with authentication, testing and support for your user accounts.
- Internal documentation

## 🔧 Contributing

Contributions are absolutely welcome! You can start contributing by cloning this repository and running:

```
pnpm install
pnpm dev
```

### Prerequisites

To work develop and contribute to Zudoku you will need:

- [Node.js](https://nodejs.org/) >= v20.0.0
- [Git](https://git-scm.com/)
- [pnpm](https://pnpm.io/installation)

More detail on the process for contributing can be found in the [contributing guide](CONTRIBUTING.md).

## Changelog

Details of the latest updates to Zudoku can be found in the [changelog](CHANGELOG.md).

## 🎯 Motivation

At Zuplo, we couldn’t find an open-source solution that met our high standards for both trustworthiness and programmability, so we decided to create our own. And since no one chooses Zuplo solely because of our documentation, we felt great about open-sourcing this tool and making it easy for anyone to self-host.

We hope that if you use it, you’ll think fondly of Zuplo, and one day, when you’re looking for a gateway or API management product, you’ll consider us as a vendor to evaluate.

Zudoku will always be open-source. It will always be free.

## License

Zudoku is licensed under MIT. See the full [license](LICENSE.md).
