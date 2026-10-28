---
title: x-zudoku-request-box-enabled
sidebar_icon: square-code
---

Use `x-zudoku-request-box-enabled` to show or hide the request box at the top of an operation's
sidecar for a specific operation. By default, the request box is shown for all operations unless
globally disabled via the [`disableRequestBox`](/docs/configuration/api-reference) option.

The request box holds the method and path, the generated code snippet (or your
[`x-code-samples`](./x-code-samples)) with its language selector, the auth selector and the button
that opens the playground. Hiding it also removes the way to open the playground for that operation.
The request body and response examples below it are still shown.

## Location

The extension is added at the **Operation Object** level.

| Option                         | Type      | Description                                      |
| ------------------------------ | --------- | ------------------------------------------------ |
| `x-zudoku-request-box-enabled` | `boolean` | Show (`true`) or hide (`false`) the request box. |

If the extension is not set, the request box visibility falls back to the global `disableRequestBox`
configuration.

## Example

```yaml
paths:
  /users:
    get:
      summary: List users
      x-zudoku-request-box-enabled: true
      responses:
        "200":
          description: Successful response
  /webhooks/trigger:
    post:
      summary: Trigger webhook
      x-zudoku-request-box-enabled: false
      responses:
        "200":
          description: Accepted
```

In this example, `List users` shows the request box while `Trigger webhook` hides it regardless of
the global setting.
