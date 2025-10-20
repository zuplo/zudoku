---
title: LLM-Friendly Documentation Export
navigation_label: llms.txt
navigation_icon: bot
---

Zudoku can generate LLM-friendly versions of your documentation following the
[llms.txt](https://llmstxt.org/) specification.

During build, three types of files are generated:

- **`.md` files** - Individual pages with frontmatter removed
- **`llms.txt`** - Summary with links to all pages
- **`llms-full.txt`** - Complete documentation in one file

All features are enabled by default.

## Configuration

The `llms` configuration is nested under the `docs` configuration:

```tsx title="zudoku.config.tsx"
export default {
  docs: {
    files: "pages/**/*.{md,mdx}", // Your markdown files
    llms: {
      publishMarkdown: true, // Generate .md files
      llmsTxt: true, // Generate llms.txt
      llmsTxtFull: true, // Generate llms-full.txt
      includeProtected: false, // Exclude protected routes
    },
  },
};
```

All options are disabled by default.

### `publishMarkdown`

Generates `.md` files for each page without frontmatter. Pages at `/docs/quickstart` are also
accessible at `/docs/quickstart.md`.

### `llmsTxt`

Generates an `llms.txt` file with links to all documentation pages:

```markdown title="llms.txt"
# Documentation

- [Quickstart](/docs/quickstart.md): Get started with Zudoku
- [Writing](/docs/writing.md): A guide to writing documentation
```

### `llmsTxtFull`

Generates `llms-full.txt` containing the complete content of all pages.

### `includeProtected`

By default, protected routes are excluded. Set to `true` to include them.

## Output

Generated files are available at:

```text
dist/
├── llms.txt           # Summary with links
├── llms-full.txt      # Complete documentation
└── docs/
    ├── quickstart.md  # Individual page markdown
    ├── writing.md
    └── ...
```

Redirect pages, error pages (400, 404, 500), and protected routes are automatically excluded.
