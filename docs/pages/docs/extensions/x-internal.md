---
title: x-internal
sidebar_icon: eye-off
---

Use `x-internal` to mark operations or parameters as internal. This extension has no built-in
rendering effect on its own — it is designed to be used with the
[`removePaths` and `removeParameters` processors](/docs/guides/processors) to exclude internal
endpoints from your public documentation.

## Location

The extension can be added at the **Operation Object** or **Parameter Object** level.

| Option       | Type      | Description                              |
| ------------ | --------- | ---------------------------------------- |
| `x-internal` | `boolean` | When `true`, marks the item as internal. |

## Example

```yaml
paths:
  /users:
    get:
      summary: List users
      responses:
        "200":
          description: Successful response
  /internal/health:
    get:
      summary: Health check
      x-internal: true
      responses:
        "200":
          description: OK
  /users/{id}:
    get:
      summary: Get user
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
        - name: debug
          in: query
          x-internal: true
          schema:
            type: boolean
      responses:
        "200":
          description: Successful response
```

## Using with processors

To strip internal items from the published docs, add the built-in processors to your build config:

```ts title="zudoku.build.ts"
import { removePaths } from "zudoku/processors/removePaths";
import { removeParameters } from "zudoku/processors/removeParameters";
import type { ZudokuBuildConfig } from "zudoku";

const buildConfig: ZudokuBuildConfig = {
  processors: [
    removePaths({
      shouldRemove: ({ operation }) => operation["x-internal"],
    }),
    removeParameters({
      shouldRemove: ({ parameter }) => parameter["x-internal"],
    }),
  ],
};

export default buildConfig;
```

See the [Processors guide](/docs/guides/processors) for more details.
