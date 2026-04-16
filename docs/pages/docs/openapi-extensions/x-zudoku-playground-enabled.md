---
title: x-zudoku-playground-enabled
sidebar_icon: toggle-right
---

Use `x-zudoku-playground-enabled` to show or hide the interactive API playground for a specific
operation. By default, the playground is shown for all operations unless globally disabled via the
[`disablePlayground`](/docs/configuration/api-reference) option.

## Location

The extension is added at the **Operation Object** level.

| Option                        | Type      | Description                                     |
| ----------------------------- | --------- | ----------------------------------------------- |
| `x-zudoku-playground-enabled` | `boolean` | Show (`true`) or hide (`false`) the playground. |
| `x-explorer-enabled`          | `boolean` | Alias for `x-zudoku-playground-enabled`.        |

Both extensions are checked — if either is explicitly set, that value is used. If neither is set,
the playground visibility falls back to the global `disablePlayground` configuration.

## Example

```yaml
paths:
  /users:
    get:
      summary: List users
      x-zudoku-playground-enabled: true
      responses:
        "200":
          description: Successful response
  /webhooks/trigger:
    post:
      summary: Trigger webhook
      x-zudoku-playground-enabled: false
      responses:
        "200":
          description: Accepted
```

In this example, `List users` shows the playground while `Trigger webhook` hides it regardless of
the global setting.
