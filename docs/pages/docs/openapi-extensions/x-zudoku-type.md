---
title: x-zudoku-type
sidebar_icon: layout-grid
---

Use `x-zudoku-type` to change how Zudoku renders an entire OpenAPI document, instead of the default
REST API view.

## Location

The extension is added at the **Root Object** level — the outermost level of the OpenAPI
description.

| Option          | Type     | Description                            |
| --------------- | -------- | -------------------------------------- |
| `x-zudoku-type` | `string` | The renderer to use for this document. |

| Value           | Renders as                                                      |
| --------------- | --------------------------------------------------------------- |
| `"mcp-catalog"` | A searchable, filterable catalog of the document's MCP servers. |

Values Zudoku does not recognise are ignored with a build warning, and the document falls back to
the default API view. This keeps a description written for a newer version of Zudoku building
against an older one.

## `mcp-catalog`

A catalog document renders as a **single page** listing every operation marked with
[`x-mcp-server`](./x-mcp-server) as a card, in one grid that can be searched and filtered by tag.
Selecting a card opens the server's install instructions and its tool list.

Because the whole document becomes a catalog, a few things change:

- **Only MCP servers are rendered.** Operations without `x-mcp-server` are not shown, and the
  document contributes no sidebar entries, tag pages, or schema page. If you also want to document
  plain REST endpoints, put them in a separate OpenAPI document with its own `apis` entry.
- **Tags become filters** rather than pages or headings. Each tag appears as a filter chip and as a
  badge on its servers' cards; the grid itself stays flat. Servers without a tag are filed under
  "Other". The active filter is kept in the URL as `?tag=`, so a filtered view can be linked.
- **Only the latest version is rendered.** Catalog documents do not support version switching; a
  versioned API marked as a catalog warns at build time.

The extension is read while your schema is processed, so it applies to `type: "file"` and
`type: "raw"` APIs. `type: "url"` schemas are fetched in the browser after routing is decided, so
the flag has no effect on them.

## Example

```yaml
openapi: 3.1.0
x-zudoku-type: mcp-catalog
info:
  title: Employee MCP Servers
  version: 1.0.0
servers:
  - url: https://mcp.example.com
tags:
  - name: CRM & Customer Operations
paths:
  /v1/salesforce/sales-cloud/mcp:
    post:
      summary: Salesforce Sales Cloud
      description: Read-only access to accounts, opportunities and contacts.
      tags:
        - CRM & Customer Operations
      x-mcp-server:
        name: salesforce-sales-cloud
        version: 1.0.0
        tools:
          - name: searchAccounts
            description: Find accounts by name, domain or owner.
```

This renders one catalog page with a single `Salesforce Sales Cloud` card, reachable via a
`CRM & Customer Operations` filter chip. The card opens install snippets for Claude, ChatGPT,
Cursor, VS Code and Codex, alongside the server's tools.

## Related

- [`x-mcp-server`](./x-mcp-server) — mark an individual operation as an MCP server
