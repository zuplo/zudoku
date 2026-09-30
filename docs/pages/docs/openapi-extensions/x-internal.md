---
title: x-internal
sidebar_icon: eye-off
---

Use `x-internal` to hide internal endpoints and parameters from your API documentation. Anything
marked with `x-internal: true` is removed from the schema before Zudoku renders it, so it doesn't
show up in the navigation, on operation pages, in the playground, or in documents published with
[`publish`](/docs/configuration/api-reference#publish-a-canonical-openapi-document).

`x-internal` is built in and applies to every Zudoku project. You don't need to add a
[schema processor](/docs/guides/processors) for it.

:::warning

`x-internal` only affects the documentation. The endpoints still exist on your API and can still be
called. Don't rely on it to secure anything.

:::

## Location

The extension can be added at the following levels:

| Level                | Effect                                                              |
| -------------------- | ------------------------------------------------------------------- |
| **Path Item Object** | Removes the whole path, including all of its operations.            |
| **Operation Object** | Removes only that operation. Other methods on the same path stay.   |
| **Parameter Object** | Removes the parameter from path items, operations and `components`. |

| Option       | Type      | Description                                          |
| ------------ | --------- | ---------------------------------------------------- |
| `x-internal` | `boolean` | Set to `true` to remove the item from documentation. |

Parameters defined in `components.parameters` are removed along with every `$ref` that points to
them.

Other objects such as tags, schemas, schema properties and responses are not covered. Use a custom
[schema processor](/docs/guides/processors#custom-processors) if you need to hide those.

## Example

```yaml
paths:
  /admin:
    x-internal: true # hides the entire path
    get:
      summary: Admin dashboard
      responses:
        "200":
          description: OK
  /users:
    get:
      summary: List users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
        - name: debug
          in: query
          x-internal: true # hides only this parameter
          schema:
            type: boolean
        - $ref: "#/components/parameters/TraceId"
      responses:
        "200":
          description: OK
    delete:
      summary: Delete all users
      x-internal: true # hides only this operation
      responses:
        "204":
          description: Deleted
components:
  parameters:
    TraceId:
      name: X-Trace-Id
      in: header
      x-internal: true # hides the parameter everywhere it is referenced
      schema:
        type: string
```

In this example, the documentation shows `GET /users` with only the `limit` parameter. The `/admin`
path, the `DELETE /users` operation, the `debug` parameter and the `X-Trace-Id` header are all
hidden.

## Notes

- `x-internal` applies to APIs loaded from files (`type: "file"`), the same as other
  [schema processors](/docs/guides/processors). Schemas loaded from a URL are not processed.
- Your own schema processors in `zudoku.build.ts` run first, so they can add `x-internal` to items
  programmatically.
- The [`schemaDownload`](/docs/configuration/api-reference#options) option serves your original
  schema file, which still contains the items marked with `x-internal`.
- There is currently no option to turn this behavior off. If you need to keep an item in your
  documentation, remove its `x-internal` flag.
