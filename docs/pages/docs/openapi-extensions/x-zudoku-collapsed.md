---
title: x-zudoku-collapsed
sidebar_icon: chevrons-down-up
---

Use `x-zudoku-collapsed` to control whether a tag category starts expanded or collapsed in the API
navigation sidebar.

## Location

The extension is added at the **Tag Object** level.

| Option               | Type      | Description                                                       |
| -------------------- | --------- | ----------------------------------------------------------------- |
| `x-zudoku-collapsed` | `boolean` | Whether the tag starts collapsed. Defaults to `true` (collapsed). |

When not set, the collapsed state falls back to the inverse of the
[`expandAllTags`](/docs/configuration/api-reference) option in the API configuration.

## Example

```yaml
tags:
  - name: Getting Started
    x-zudoku-collapsed: false
  - name: Advanced
    x-zudoku-collapsed: true
```

In this example, `Getting Started` is expanded by default while `Advanced` starts collapsed.

## Related

- [`x-zudoku-collapsible`](./x-zudoku-collapsible) — control whether a tag section can be collapsed
  at all
