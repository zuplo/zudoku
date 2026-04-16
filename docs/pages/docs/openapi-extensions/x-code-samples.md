---
title: x-code-samples
sidebar_icon: code
---

Use `x-code-samples` (or `x-codeSamples`) to provide custom code snippets for an API operation. When
present, these samples appear in the sidecar panel alongside the auto-generated request examples.

## Location

The extension is added at the **Operation Object** level.

| Option           | Type                   | Description                   |
| ---------------- | ---------------------- | ----------------------------- |
| `x-code-samples` | `[Code Sample Object]` | Array of custom code samples. |
| `x-codeSamples`  | `[Code Sample Object]` | Alias for `x-code-samples`.   |

## Code Sample Object

| Property | Type     | Required | Description                                          |
| -------- | -------- | -------- | ---------------------------------------------------- |
| `lang`   | `string` | Yes      | Language identifier used for syntax highlighting.    |
| `label`  | `string` | No       | Display label for the tab. Defaults to `lang` value. |
| `source` | `string` | Yes      | The code snippet content.                            |

## Example

```yaml
paths:
  /users:
    get:
      summary: List users
      x-code-samples:
        - lang: curl
          label: cURL
          source: |
            curl -X GET https://api.example.com/users \
              -H "Authorization: Bearer $TOKEN"
        - lang: python
          label: Python
          source: |
            import requests

            response = requests.get(
                "https://api.example.com/users",
                headers={"Authorization": f"Bearer {token}"},
            )
        - lang: javascript
          label: JavaScript
          source: |
            const response = await fetch("https://api.example.com/users", {
              headers: { Authorization: `Bearer ${token}` },
            });
      responses:
        "200":
          description: Successful response
```
