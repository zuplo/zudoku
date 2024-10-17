---
title: HTML Quickstart
description: Create beautiful API documentation for your OpenAPI file with Zudoku using a single HTML page in seconds.
sidebar_icon: chevrons-left-right
---

This quickstart will walk you through using the standalone HTML version of Zudodu to create beautiful API documentation for your OpenAPI file in seconds. No special tools, setup, or installation required. Just a single HTML page.

1. Using any text editor, create a new HTML file (usually named `index.html`) and paste the following code into it.
2. Replace `https://api.example.com/openapi.json` with the URL to your OpenAPI file.

:::caution{title="CORS"}

The url you host your OpenAPI file on must allow CORS requests from the domain you are hosting your HTML file on. The easiest way to do this is to host both files on the same domain.

:::

```html
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

3. Save the file and use any web server to host it. If you have Node.js installed you can simply run the following command in the same directory as your HTML file:

```bash
npx serve
```
