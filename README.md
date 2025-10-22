<div align=center>

<a href="https://zudoku.dev" alt="Zudoku">
  <img src="./assets/github-hero.png" width=630 alt="Zudoku Docs & Developer Portal">
</a>

[![MIT License](https://img.shields.io/badge/license-mit-green?style=flat&labelColor=000000)](https://github.com/zuplo/zudoku/license.md)
[![Zudoku Version](https://img.shields.io/npm/v/zudoku.svg?style=flat&labelColor=000000)](https://www.npmjs.com/package/zudoku)
[![Create Zudoku App Version](https://img.shields.io/npm/v/create-zudoku?label=cli&style=flat&labelColor=000000)](https://www.npmjs.com/package/create-zudoku)
[![Made with love by Zuplo](https://img.shields.io/badge/Made%20by%20Zuplo-FF00BD.svg?style=flat&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAzNyAzMiIgYXJpYS1oaWRkZW49InRydWUiPgogIDxwYXRoIGZpbGw9IiNGRjAwQkQiIGQ9Ik0yNy4xNDIgMTkuOTc4SDE2LjYyTDI3LjgzIDguNzQ2YS43NTguNzU4IDAgMDAtLjUzNC0xLjI5M0g5LjQ4OFYwaDE5LjUzNGE3LjU3MyA3LjU3MyAwIDAxNC4wNjUgMS4xMjUgNy41OTEgNy41OTEgMCAwMTIuODM2IDMuMTI2IDcuNDAyIDcuNDAyIDAgMDEtMS40NjEgOC4zOThsLTcuMzIgNy4zMjh6Ii8+CiAgPHBhdGggZmlsbD0iI0ZGMDBCRCIgZD0iTTkuNDg5IDExLjA0MmgxMC41MjRsLTExLjE5IDExLjIxYS43NzIuNzcyIDAgMDAuNTQzIDEuMzE2aDE3Ljc1OXY3LjQ1Mkg3LjYxYTcuNTc0IDcuNTc0IDAgMDEtNC4wNjUtMS4xMjVBNy41OTMgNy41OTMgMCAwMS43MSAyNi43NjhhNy40MDMgNy40MDMgMCAwMTEuNDYyLTguMzk3bDcuMzE4LTcuMzI5eiIvPgo8L3N2Zz4K&labelColor=000)](https://zuplo.com)

</div>

# Zudoku

API documentation should always be free.

<a href="#-installation"><strong>Installation</strong></a> ·
<a href="https://zudoku.dev/docs/quickstart"><strong>Docs</strong></a> ·
<a href="#-examples"><strong>Examples</strong></a> ·
<a href="#-contributing--community"><strong>Contributing</strong></a> ·
<a href="#-motivation"><strong>Motivation</strong></a>

## Introduction

**Zudoku** (pronounced "zoo-doh-koo") is an open-source, highly customizable API documentation
framework for building quality developer experiences around OpenAPI and, soon, GraphQL documents.

Because great API documentation frameworks should be:

🌍 Free & Open Source<br /> ✅ OpenAPI powered<br /> 🔩 Extensible with Plugins<br /> ⚡ Easy to
setup & blazing fast to work with<br /> 🔧 Easy to maintain

## 🤩 Try it, right now!

You can test Zudoku with your own OpenAPI document at
[zudoku.dev](https://zudoku.dev?utm_source=github&utm_medium=web&utm_content=link&ref=github) and
see how good your documentation can look!

## ✨ Features

- 🚀 Generate documentation from a single or multiple [OpenAPI](https://swagger.io/specification/)
  schema
- 📄 Create [MDX pages](https://mdxjs.com/) for anything you want to document
- 🔐 Integrate your users with authentication via OpenID or OAuth2
- 🧪 Let users test their API calls using the Integrated Playground (includes authentication!)
- 🌑 Dark mode (of course!)

Zudoku is quick to implement, easy to configure and is highly composable with sensible defaults.

## ⚙️ Installation

You can use the CLI to generate a new project or use it standalone via CDN as a React component.

### ⚡️ Quick start

Fire up your new API docs using the command line generator:

```
npm create zudoku@latest
```

### 📦 Standalone via CDN

Add the package and styles to your `<head>` and pass the URL for your API schema to the
`data-api-url` property, as shown here:

```html
<!doctype html>
<html>
  <head>
    <title>Zudoku Demo</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link rel="icon" type="image/svg+xml" href="https://cdn.zudoku.dev/logos/favicon.svg" />
    <script type="module" src="https://cdn.zudoku.dev/latest/main.js" crossorigin></script>
    <link rel="stylesheet" href="https://cdn.zudoku.dev/latest/style.css" crossorigin />
  </head>
  <body>
    <div data-api-url="https://api.example.com/openapi.json"></div>
  </body>
</html>
```

### 🧱 Getting started templates

To get started with some of the features Zudoku offers you can use one of these
[example templates](https://github.com/zuplo/zudoku/tree/main/examples):

| Template                                                                                | What it does                                          |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [many-apis](https://github.com/zuplo/zudoku/tree/main/examples/many-apis)               | Using more than one OpenAPI document with Zudoku      |
| [with-auth0](https://github.com/zuplo/zudoku/tree/main/examples/with-auth0)             | Authenticate users in docs with the Auth0 plugin      |
| [with-config](https://github.com/zuplo/zudoku/tree/main/examples/with-config)           | Barebones config, ready for you to setup how you like |
| [with-vite-config](https://github.com/zuplo/zudoku/tree/main/examples/with-vite-config) | Use Zudoku with your Vite config (Advanced)           |

## 🎓 Examples

- [Rick & Morty API](https://zudoku.dev/demo?api-url=https://rickandmorty.zuplo.io/openapi.json)
- [Pet Store API](https://zudoku.dev/demo?api-url=https://zudoku.dev/petstore.oas.json)
- [Zuplo API Documentation](https://zuplo.com/docs)

### Zudoku use cases

Zudoku is a flexible and highly customizable framework that can be used to create many things,
including:

- Standalone documentation websites
- OpenAPI powered API references
- A developer portal with documentation, fully functional API reference for testing and
  authentication support for your user accounts.
- Internal documentation

## 🔧 Contributing & Community

For details on how to contribute to Zudoku, see the [contributing guide](CONTRIBUTING.md).

## Changelog

Details of the latest updates to Zudoku can be found in the [changelog](CHANGELOG.md).

## 🎯 Motivation

At Zuplo, we couldn’t find an open-source solution that met our high standards for both
trustworthiness and programmability, so we decided to create our own. And since no one chooses Zuplo
solely because of our documentation, we felt great about open-sourcing this tool and making it easy
for anyone to self-host.

We hope that if you use it, you’ll think fondly of Zuplo, and one day, when you’re looking for a
gateway or API management product, you’ll consider us as a vendor to evaluate.

Zudoku will always be open-source. It will always be free.

## License

Zudoku is licensed under MIT. See the full [license](LICENSE.md).

<a href="https://twitter.com/zuplo">
  <img alt="X (formerly Twitter) Follow" src="https://img.shields.io/twitter/follow/zuplo">
</a>
