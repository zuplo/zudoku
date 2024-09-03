---
title: Installation
---

To get started with Zudoku you can either build a project using our generator, or import the CDN hosted package.

## Install with `create-zudoku-app`

To generate a new Zudoku site, run:

```command
npm create zudoku-app@latest
```

The generator will take you through the setup steps and scaffold a minimal but fully functional documentation site for you to get started with.

## Install standalone CDN package

To use the packaged version you will need to add the following to the `<head>` of the HTML page that you would like to render your API documentation:

```HTML
<!-- Import the Zudoku package -->
<script type="module" src="https://cdn.zudoku.dev/latest/main.js" crossorigin></script>

<!-- Import the Zudoku default stylesheet -->
<link rel="stylesheet" href="https://cdn.zudoku.dev/latest/style.css" crossorigin />
```

Next, add a new `<div>` to the `<body>` of the page to configure the URL of the OpenAPI specification that you want to display documentation for:

```HTML
<div data-api-url="https://api.example.com/openapi.json"></div>
```

All put together, your HTML page should look something like this:

```HTML
<!doctype html>
<html>
  <head>
    <title>API Documentation powered by Zudoku</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script type="module" src="https://cdn.zudoku.dev/latest/main.js" crossorigin></script>
    <link rel="stylesheet" href="https://cdn.zudoku.dev/latest/style.css" crossorigin />
  </head>
  <body>
    <div data-api-url="https://api.example.com/openapi.json"></div>
  </body>
</html>
```
