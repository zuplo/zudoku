---
title: x-zudoku-page-title
sidebar_icon: app-window
---

Use `x-zudoku-page-title` to set the browser title (the HTML `<title>`) of a tag's page without
changing its sidebar label or page heading.

By default, the title of a tag page is built from the tag's [`x-displayName`](./x-display-name) (or
`name`) and the API title, for example `Location Key - Weather API`. When several tags share the
same display name, such as tags in different [`x-tagGroups`](./x-tag-groups), their pages end up
with the same title. Set `x-zudoku-page-title` to give each page a unique title for search engines
and browser tabs.

## Location

The extension is added at the **Tag Object** level.

| Option                | Type     | Description                                                       |
| --------------------- | -------- | ----------------------------------------------------------------- |
| `x-zudoku-page-title` | `string` | Browser title for the tag's page. Replaces the default tag title. |

The value replaces the whole default title (tag name and API title). The site-wide
[`metadata.title`](/docs/configuration/overview#metadata) template still applies, so with
`title: "%s | My Developer Portal"` the final title becomes
`Daily Forecasts by Location Key | My Developer Portal`.

The title is part of the server-rendered and prerendered HTML, so search engines see it without
running JavaScript.

## Example

```yaml
x-tagGroups:
  - name: Daily Forecasts
    tags:
      - location-key-daily
  - name: Hourly Forecasts
    tags:
      - location-key-hourly

tags:
  - name: location-key-daily
    x-displayName: Location Key
    x-zudoku-page-title: Daily Forecasts by Location Key
  - name: location-key-hourly
    x-displayName: Location Key
    x-zudoku-page-title: Hourly Forecasts by Location Key
```

Both tags still show `Location Key` in the sidebar and as the page heading, while their pages get
the browser titles `Daily Forecasts by Location Key` and `Hourly Forecasts by Location Key`.

## Related

- [`x-displayName`](./x-display-name) — change the label shown in the sidebar, headings and default
  page title
- [`x-tagGroups`](./x-tag-groups) — group tags into sidebar sections
