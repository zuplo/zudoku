---
sidebar_icon: folder-open
---

# Static Files

Zudoku makes it easy to serve static files like images, PDFs, or any other assets alongside your documentation. Any files placed in the `public` directory will be served at the root path of your documentation site.

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
