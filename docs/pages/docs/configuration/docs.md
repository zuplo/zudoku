---
title: Documentation
navigation_label: Documentation
navigation_icon: book
---

Zudoku uses a file-based routing system for documentation pages, similar to many modern frameworks.
This page explains how routing works and how to customize it.

## File Based Routing

By default, Zudoku automatically creates routes for all Markdown and MDX files based on their file
path. Files are served at URLs that match their file structure, minus the file extension.

### Basic Examples

```text title="File tree"
pages/
├── introduction.md         → /introduction
├── quickstart.mdx          → /quickstart
├── guides/
│   ├── getting-started.md  → /guides/getting-started
│   └── advanced.md         → /guides/advanced
└── api/
    └── reference.md        → /api/reference
```

### File Extensions

Both `.md` and `.mdx` files are supported:

- `.md` files support standard Markdown with frontmatter
- `.mdx` files support JSX components within Markdown

The file extension is automatically removed from the URL.

## Custom Paths

You can override the default file-based routing by specifying custom paths in your navigation
configuration. When a file has a custom path, it will only be accessible at that custom path, not at
its original file-based path.

### Navigation Configuration

```tsx {5-6,13-14} title="zudoku.config.tsx" showLineNumbers
export default {
  navigation: [
    {
      type: "doc",
      file: "guides/getting-started.md",
      path: "start-here", // Custom path
      label: "Start Here",
    },
    {
      type: "category",
      label: "Advanced",
      link: {
        file: "guides/advanced.md",
        path: "advanced-guide", // Custom path for category link
      },
      items: [
        // ... other items
      ],
    },
  ],
};
```

In this example:

- `guides/getting-started.md` is accessible at `/start-here` (not `/guides/getting-started`)
- `guides/advanced.md` is accessible at `/advanced-guide` (not `/guides/advanced`)

## Configuration Options

Configure docs routing and behavior through the `docs` section in your config:

```tsx title="zudoku.config.tsx"
export default {
  docs: {
    files: ["/pages/**/*.{md,mdx}"],
    defaultOptions: {
      toc: true,
      disablePager: false,
      showLastModified: true,
      suggestEdit: {
        url: "https://github.com/your-org/your-repo/edit/main/docs",
        text: "Edit this page",
      },
    },
  },
};
```

### `files`

**Type:** `string | string[]`  
**Default:** `"/pages/**/*.{md,mdx}"`

Glob patterns that specify which files to include as documentation pages. You can provide a single
pattern or an array of patterns.

```tsx title="zudoku.config.tsx"
// Single pattern
docs: {
  files: "/content/**/*.md";
}

// Multiple patterns
docs: {
  files: ["/pages/**/*.{md,mdx}", "/guides/**/*.md", "/tutorials/**/*.mdx"];
}
```

### `defaultOptions`

Default options applied to all documentation pages. These can be overridden on individual pages
using frontmatter.

#### `toc`

**Type:** `boolean`  
**Default:** `true`

Whether to show the table of contents (TOC) by default.

```tsx title="zudoku.config.tsx"
docs: {
  defaultOptions: {
    toc: false; // Hide TOC by default
  }
}
```

#### `disablePager`

**Type:** `boolean`  
**Default:** `false`

Whether to disable the previous/next page navigation by default.

```tsx title="zudoku.config.tsx"
docs: {
  defaultOptions: {
    disablePager: true; // Disable pager by default
  }
}
```

#### `showLastModified`

**Type:** `boolean`  
**Default:** `false`

Whether to show the last modified date by default.

```tsx title="zudoku.config.tsx"
docs: {
  defaultOptions: {
    showLastModified: true; // Show last modified date
  }
}
```

#### `suggestEdit`

**Type:** `{ url: string; text?: string }`  
**Default:** `undefined`

Configuration for the "Edit this page" link.

```tsx title="zudoku.config.tsx"
docs: {
  defaultOptions: {
    suggestEdit: {
      url: "https://github.com/your-org/your-repo/edit/main/docs",
      text: "Edit this page on GitHub"  // Optional custom text
    }
  }
}
```

The `url` should be a template where the file path will be appended. For example, if your docs are
in a `docs/pages/` directory, the URL might be
`https://github.com/your-org/your-repo/edit/main/docs/pages`.

#### `copyPage`

**Type:** `boolean` **Default:** `undefined`

Whether to show a copy button in the page header that allows users to copy the page markdown. This
feature requires `publishMarkdown` to be enabled (see below).

```tsx title="zudoku.config.tsx"
docs: {
  defaultOptions: {
    copyPage: true; // Enable copy button for all pages
  }
}
```

The copy button provides:

- A primary "Copy page" action that copies the markdown to clipboard
- A dropdown with additional options:
  - Copy link to page
  - Open markdown file (requires `publishMarkdown: true`)
  - Open in Claude
  - Open in ChatGPT

> **Note:** The copy button requires `publishMarkdown: true` to be set in your docs config. If
> `copyPage` is enabled but `publishMarkdown` is not, a warning will be displayed.

### `publishMarkdown`

**Type:** `boolean` **Default:** `false`

When enabled, generates `.md` files for each documentation page during build. Pages can then be
accessed at their URL path with the `.md` extension appended (e.g., `/docs/quickstart.md`).

```tsx title="zudoku.config.tsx"
docs: {
  publishMarkdown: true,
}
```

The generated markdown files:

- Have frontmatter removed for cleaner content
- Are accessible at `{page-url}.md` in both development and production
- Are required for the `copyPage` button functionality
- Are used by LLM features (see [llms.txt configuration](/docs/configuration/llms) for more details)

### `llms`

**Type:** `object` **Default:** `undefined`

Configuration for generating LLM-friendly documentation files. See the
[llms.txt configuration](/docs/configuration/llms) page for complete documentation.

```tsx title="zudoku.config.tsx"
docs: {
  llms: {
    llmsTxt: true,        // Generate llms.txt summary file
    llmsTxtFull: true,    // Generate llms-full.txt with complete content
    includeProtected: false
  }
}
```

## Overriding Defaults

You can override [default options](#defaultoptions) on individual pages using frontmatter:

```markdown
---
toc: false
disablePager: true
showLastModified: false
---

# My Page

This page has custom options that override the defaults.
```

## Route Resolution

Zudoku resolves routes in the following order:

1. **Custom paths from navigation** - If a file has a custom path defined in navigation, it's served
   at that path
2. **File-based paths** - All other files are served at their file-based paths

## Best Practices

1. **Use descriptive file names** - File names become part of the URL, so make them clear and
   SEO-friendly
2. **Organize with folders** - Use folder structure to group related content
3. **Custom paths for better UX** - Use custom paths for important pages that need memorable URLs
   (sometimes also called slugs)
4. **Consistent naming** - Use consistent naming conventions for files and folders
