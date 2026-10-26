---
title: x-zudoku-seo
sidebar_icon: search
---

Use `x-zudoku-seo` to set the browser title and meta description of a tag's page without changing
the label shown in the sidebar or the page heading. This is useful when several tags share the same
[`x-displayName`](./x-display-name) but should still have unique titles for search engines.

## Location

The extension is added at the **Tag Object** level.

| Option        | Type     | Description                                                                   |
| ------------- | -------- | ----------------------------------------------------------------------------- |
| `title`       | `string` | Page title used in the `<title>` tag. Replaces `<tag name> - <API title>`.    |
| `description` | `string` | Content of the `<meta name="description">` tag. Replaces the tag description. |

Both properties are optional. Anything not set falls back to the default behavior. If
[`metadata.title`](/docs/configuration/overview#metadata) is a template string (e.g.
`%s - My Company`), it is still applied to the title.

The title and description are rendered on the server, so they are part of the prerendered HTML and
visible to crawlers without running JavaScript.

## Example

```yaml
tags:
  - name: location-key-daily
    x-displayName: Location Key
    x-zudoku-seo:
      title: Daily Forecasts by Location Key - Core Weather
      description: Daily forecasts for a location key, up to 15 days ahead.
  - name: location-key-hourly
    x-displayName: Location Key
    x-zudoku-seo:
      title: Hourly Forecasts by Location Key - Core Weather
      description: Hourly forecasts for a location key, up to 240 hours ahead.
```

Both tags show `Location Key` in the sidebar and as the page heading, but each page has its own
browser title and description.

To do the same for a Markdown page, use the [`seo`](/docs/markdown/frontmatter#seo) frontmatter
property.
