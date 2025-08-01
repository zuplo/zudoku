---
title: Static Files
sidebar_icon: folder-open
description:
  Learn how to serve and reference static files like images and PDFs in your Zudoku documentation
  using the public directory.
---

Zudoku makes it easy to serve static files like images, PDFs, or any other assets alongside your
documentation. Any files placed in the `public` directory will be served at the root path `/` during
dev, and copied to the root of the dist directory as-is.

Note that you should always reference `public` assets using root absolute path - for example,
`public/icon.png` should be referenced in source code as `/icon.png`.

## Usage

1. Create a `public` directory in your project root if it doesn't exist already
2. Place any static files in this directory
3. Reference these files in your documentation using the root path `/`

## Example

If you have the following structure:

```
your-project/
├── public/
│   ├── images/
│   │   └── diagram.png
│   └── documents/
│       └── api-spec.pdf
└── ...
```

You can reference these files using markdown like this:

```md
![API Architecture](/images/diagram.png)
```

If you want users to download a file like a PDF, you can use an anchor tag like this:

```html
<a href="/documents/api-spec.pdf" download="/documents/api-spec.pdf">Download API specification</a>
```

## Relative paths

If you want to reference a file that is in the same directory as the current file, you can also use
a relative path:

```md title="page.mdx"
![API Architecture](./image.png)
```
