---
sidebar_icon: scissors-line-dashed
title: Frontmatter
description:
  Learn how to use YAML frontmatter in Zudoku markdown files to customize page titles, descriptions,
  navigation, and other document properties.
---

Frontmatter is metadata written in [YAML](https://yaml.org/) format at the beginning of markdown
files, enclosed between triple dashes (`---`). It allows you to configure various aspects of your
pages without affecting the visible content.

In Zudoku, frontmatter enables you to customize page titles, descriptions, navigation settings, and
other document properties. Here are all the supported properties:

## Properties

### `title`

Sets the page title that appears in the browser tab and as the document title.

```md
---
title: My Page Title
---
```

### `description`

Provides a description for the page, which can be used for SEO and content summaries.

```md
---
description: This page explains how to use Zudoku's markdown features.
---
```

### `category`

Assigns the page to a specific category for organizational purposes. This will be shown above the
main heading of the document.

```md
---
category: Getting Started
---
```

### `sidebar_label`

Sets a custom label for the page in the sidebar navigation, allowing you to use a shorter or
different title than the main page title.

```md
---
title: My Very Long Documentation Page Title
sidebar_label: Short Title
---
```

The legacy name `navigation_label` is also supported but `sidebar_label` is preferred.

### `sidebar_icon`

Specifies a [Lucide icon](https://lucide.dev/icons) to display next to the page in the sidebar
navigation.

```md
---
sidebar_icon: compass
---
```

The legacy name `navigation_icon` is also supported but `sidebar_icon` is preferred.

### `navigation_display`

Specifies the display property of the navigation item. See the
[Navigation guide](/docs/configuration/navigation#display-control)

```md
---
navigation_display: auth
---
```

### `toc`

Controls whether the table of contents is displayed for the page. Set to `false` to hide the table
of contents.

```md
---
toc: false
---
```

### `fullWidth`

Removes the table of contents sidebar and lets the page content span the full available width. When
enabled, the table of contents is still accessible via an "On this page" toggle in the page header
(unless `toc: false` is also set, in which case it is hidden entirely).

```md
---
fullWidth: true
---
```

| `fullWidth` | `toc`   | Result                                                          |
| ----------- | ------- | --------------------------------------------------------------- |
| `false`     | `true`  | TOC shown in the sidebar (default).                             |
| `false`     | `false` | TOC hidden; content keeps its standard width.                   |
| `true`      | `true`  | Content spans full width; TOC is available via a toggle button. |
| `true`      | `false` | Content spans full width; TOC is not available at all.          |

### `disable_pager`

Controls whether the previous/next page navigation is displayed at the bottom of the page. Set to
`true` to disable it.

```md
---
disable_pager: true
---
```

### `showLastModified`

Controls whether the last modified date is displayed for this page. Can be used to override the
[default option](/docs/configuration/docs#showlastmodified).

```md
---
showLastModified: false
---
```

### `draft`

Marks a document as a draft. Draft documents are only visible when running in development mode and
are excluded from production builds. This is useful for working on content that isn't ready to be
published.

```md
---
draft: true
---
```

:::info

When `draft: true` is set:

- The document will be visible when running `zudoku dev`
- The document will be excluded from builds created with `zudoku build`
- The document won't appear in the navigation or be accessible via URL in production

:::

### `lastModifiedTime`

The last modified timestamp for the page. This property is automatically set by Zudoku during the
build process based on the Git commit history. You generally should not set this manually.

If you need to override the automatically detected date, you can set it explicitly:

```md
---
lastModifiedTime: 2025-11-20T10:30:00.000Z
---
```

::if{mode=opensource}

:::info

For accurate last modified dates in deployment environments, ensure full Git history is available
during builds. See the [Vercel deployment guide](/docs/deploy/vercel#accurate-last-modified-dates)
for configuration details.

:::

::

## Complete Example

Here's an example showing multiple frontmatter properties used together:

```md title=documentation.md
---
title: Advanced Configuration Guide
description: Learn how to configure advanced features in Zudoku
category: Configuration
sidebar_label: Advanced Config
sidebar_icon: settings
toc: true
disable_pager: false
draft: false
---

This page content follows the frontmatter...
```
