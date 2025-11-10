---
title: LLM-Friendly Documentation Export
navigation_label: llms.txt
navigation_icon: bot
---

Zudoku can generate LLM-friendly versions of your documentation following the
[llms.txt](https://llmstxt.org/) specification.

During build, you can optionally generate:

- **`.md` files** - Individual pages with frontmatter removed (via `publishMarkdown`)
- **`llms.txt`** - Summary with links to all pages
- **`llms-full.txt`** - Complete documentation in one file

All options are disabled by default.

## Configuration

LLM features are configured through the `docs` section in your config:

```tsx title="zudoku.config.tsx"
export default {
  docs: {
    files: "pages/**/*.{md,mdx}", // Your markdown files
    publishMarkdown: true, // Generate .md files
    llms: {
      llmsTxt: true, // Generate llms.txt
      llmsTxtFull: true, // Generate llms-full.txt
      includeProtected: false, // Exclude protected routes
    },
  },
};
```

All options are disabled by default.

:::tip

When enabled, markdown files are generated during build and deleted after creating the `llms.txt`
files unless `publishMarkdown: true` is set (see
[`publishMarkdown` docs](/docs/configuration/docs#publishmarkdown)).

:::

### `llmsTxt`

**Type:** `boolean` **Default:** `false`

Generates an `llms.txt` file with links to all documentation pages:

```markdown title="llms.txt"
# Documentation

- [Quickstart](/docs/quickstart.md): Get started with Zudoku
- [Writing](/docs/writing.md): A guide to writing documentation
```

### `llmsTxtFull`

**Type:** `boolean` **Default:** `false`

Generates `llms-full.txt` containing the complete content of all pages.

### `includeProtected`

**Type:** `boolean` **Default:** `false`

By default, protected routes are excluded. Set to `true` to include them in the generated files.

## Output

Generated files are available in the output directory after build:

```text
dist/
├── llms.txt           # Generated if llmsTxt: true
├── llms-full.txt      # Generated if llmsTxtFull: true
└── docs/
    ├── quickstart.md  # Generated if publishMarkdown: true
    ├── writing.md
    └── ...
```

**Important:** Individual `.md` files are only kept in the final build if `publishMarkdown: true`.
If only `llmsTxt` or `llmsTxtFull` is enabled, the `.md` files are generated temporarily during the
build but deleted after the `llms.txt` files are created.

Redirect pages, error pages (400, 404, 500), and protected routes (unless `includeProtected: true`)
are automatically excluded from all generated files.
