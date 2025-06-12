---
title: Markdown
---

Zudoku supports [GitHub Flavored Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax).

## Page Titles

Page titles can be added to markdown files using the `#` syntax or via the Frontmatter of the markdown file.

Using markdown headers:

```md
# A Page Title
```

Using Frontmatter:

```md
---
title: A Page Title
---
```

## Frontmatter Properties

Frontmatter in Zudoku allows you to configure various aspects of your markdown pages. Here are all the supported properties:

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

Assigns the page to a specific category for organizational purposes. This will be shown above the main heading of the document.

```md
---
category: Getting Started
---
```

### `navigation_label`

_Deprecated (`sidebar_label`)_

Sets a custom label for the page in the sidebar navigation, allowing you to use a shorter or different title than the main page title.

```md
---
title: My Very Long Documentation Page Title
navigation_label: Short Title
---
```

### `navigation_icon`

_Deprecated (`sidebar_icon`)_

Specifies a [Lucide icon](https://lucide.dev/icons) to display next to the page in the sidebar navigation.

```md
---
navigation_icon: compass
---
```

### `toc`

Controls whether the table of contents is displayed for the page. Set to `false` to hide the table of contents.

```md
---
toc: false
---
```

### `disable_pager`

Controls whether the previous/next page navigation is displayed at the bottom of the page. Set to `true` to disable it.

```md
---
disable_pager: true
---
```

## Complete Example

Here's an example showing multiple frontmatter properties used together:

```md
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
