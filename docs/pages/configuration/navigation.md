---
title: Navigation
sidebar_icon: compass
---

Navigation in Zudoku can be customized at several layers. The primary is the top navigation tabs. Tabs can reference pages, plugins, or external links. The secondary is the sidebar navigation. The sidebar can be customized to show additional links or content.

## Top Navigation

The top navigation is defined in the `topNavigation` array of the Zudoku Config file. Each item in the array is an object with an `id` and `label`. The `id` is used to identify the tab, and the `label` is the text that will be displayed.

```ts
{
  // ...
  topNavigation: [
    { id: "documentation", label: "Documentation" },
    { id: "api", label: "API Reference" },
  ];
  // ...
}
```

## Sidebar

The `sidebar` configuration section defines sidebars that can be referenced by the top navigation. Each sidebar is an object with a key that is used to reference it in the top navigation. The value is an array of objects that define the sidebar content.

The example below uses a key of documentation which can be referenced as an id in topNavigation.

Example:

```json
{
  // ...
  "sidebar": {
    "documentation": [
      {
        "type": "category",
        "label": "Zudoku",
        "items": ["introduction"]
      },
      {
        "type": "category",
        "label": "Getting started",
        "items": ["getting-started", "installation", "configuration"]
      }
    ]
  }
  // ...
}
```

### Sidebar Items

Sidebar Items can be of three types: `category`, `link`, or `doc`.

- `category` is a group of links that can be expanded or collapsed.
- `link` is a direct link to a page.
- `doc` is a link to a markdown file.

#### Category

The category type is used to group links together. The `label` is the text that will be displayed for the category, and the `items` array is an array of strings that reference the pages or documents that should be displayed under the category.

```json
{
  "type": "category",
  "label": "Getting started",
  "items": [
    "getting-started",
    "installation",
    {
      "type": "link",
      "label": "Support",
      "href": "https://support.example.com"
    }
  ]
}
```

#### Link

Links are used to reference pages or external links. The `label` is the text that will be displayed, and the `href` is the URL that the link will navigate to.

```json
{
  "type": "link",
  "label": "Support",
  "href": "https://support.example.com"
}
```

#### Doc

Doc is used to reference markdown files. The `label` is the text that will be displayed, and the `href` is the path to the markdown file.

```json
{
  "type": "doc",
  "label": "Support",
  "href": "https://support.example.com"
}
```

Documents can also be referenced by their id - the filename without the extension relative to the `pages` directory. For example, you could reference the `./pages/docs/overview.md` file as shown.

```json
{
  "type": "doc",
  "label": "Overview",
  "id": "docs/overview"
}
```

Documents can also be referenced simply by using the id string. For example, you could reference the `./pages/docs/overview.md` file as shown.

```json
{
  "type": "category",
  "label": "Getting started",
  "items": ["docs/overview"]
}
```

## Title & Labels

All navigation items can have a `label` property that is used to display the text for the item. For navigation items of type `doc`, the `label` property is optional. If not provided, the title of the markdown file will be used (either from the front matter or the first `#` header in the file).

If you want to use a different title for the navigation item than the title of the markdown file, you can provide a `sidebar_label` property in the front matter of the markdown file.

```md
---
title: My Long Title
sidebar_label: Short Title
---
```
