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

### `navigation_label`

_Deprecated (`sidebar_label`)_

Sets a custom label for the page in the sidebar navigation, allowing you to use a shorter or
different title than the main page title.

```md
---
title: My Very Long Documentation Page Title
navigation_label: Short Title
---
```

### `navigation_icon`

_Deprecated (`sidebar_icon`)_

Specifies a [Lucide icon](https://lucide.dev/icons) to display next to the page in the sidebar
navigation.

```md
---
navigation_icon: compass
---
```

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

### `disable_pager`

Controls whether the previous/next page navigation is displayed at the bottom of the page. Set to
`true` to disable it.

```md
---
disable_pager: true
---
```

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
navigation_label: Advanced Config
navigation_icon: settings
toc: true
disable_pager: false
---

This page content follows the frontmatter...
```
