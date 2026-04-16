---
title: x-zudoku-collapsible
sidebar_icon: panel-top-close
---

Use `x-zudoku-collapsible` to control whether a tag category can be collapsed or expanded by users
in the API navigation sidebar.

## Location

The extension is added at the **Tag Object** level.

| Option                 | Type      | Description                                                         |
| ---------------------- | --------- | ------------------------------------------------------------------- |
| `x-zudoku-collapsible` | `boolean` | Whether the tag can be collapsed. Defaults to `true` (collapsible). |

When set to `false`, the tag section remains permanently expanded and users cannot toggle it.

## Example

```yaml
tags:
  - name: Core API
    x-zudoku-collapsible: false
    x-zudoku-collapsed: false
  - name: Utilities
    x-zudoku-collapsible: true
```

In this example, `Core API` is always expanded and cannot be collapsed. `Utilities` can be toggled
by users.

## Related

- [`x-zudoku-collapsed`](./x-zudoku-collapsed) — control the initial collapsed state
