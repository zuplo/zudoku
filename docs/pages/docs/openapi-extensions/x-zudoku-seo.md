---
title: x-zudoku-seo
sidebar_icon: search
---

Use `x-zudoku-seo` to set the browser title (the HTML `<title>`) and meta description of a tag's
page without changing its sidebar label or page heading.

By default, the title of a tag page is built from the tag's [`x-displayName`](./x-display-name) (or
`name`) and the API title, for example `Location Key - Weather API`. When several tags share the
same display name, such as tags in different [`x-tagGroups`](./x-tag-groups), their pages end up
with the same title. Set `x-zudoku-seo` to give each page a unique title and description for search
engines and browser tabs.

## Location

The extension is added at the **Tag Object** level.

| Option                     | Type     | Description                                                                                 |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `x-zudoku-seo.title`       | `string` | Browser title for the tag's page. Replaces the default title.                               |
| `x-zudoku-seo.description` | `string` | Meta description for the tag's page. Replaces the one derived from the tag's `description`. |

Both properties are optional. Unset or empty properties fall back to the defaults.

`title` replaces the whole default title (tag name and API title). The site-wide
[`metadata.title`](/docs/configuration/overview#metadata) template still applies, so with
`title: "%s | My Developer Portal"` the final title becomes
`Daily Forecasts by Location Key | My Developer Portal`.

`description` is used as-is. Without it, the meta description is taken from the tag's `description`
with Markdown removed, which can be long. Set it to keep the description short and plain text.

Both values are part of the server-rendered and prerendered HTML, so search engines see them without
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
    x-zudoku-seo:
      title: Daily Forecasts by Location Key
      description: Get daily weather forecasts for a location key, up to 15 days ahead.
  - name: location-key-hourly
    x-displayName: Location Key
    x-zudoku-seo:
      title: Hourly Forecasts by Location Key
```

Both tags still show `Location Key` in the sidebar and as the page heading, while their pages get
the browser titles `Daily Forecasts by Location Key` and `Hourly Forecasts by Location Key`. The
hourly page keeps the meta description derived from its tag description.

## Related

- [`x-displayName`](./x-display-name) — change the label shown in the sidebar, headings and default
  page title
- [`x-tagGroups`](./x-tag-groups) — group tags into sidebar sections
