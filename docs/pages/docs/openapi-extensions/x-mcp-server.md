---
title: x-mcp-server
sidebar_icon: bot
---

Use `x-mcp-server` to mark an individual OpenAPI operation as an
[MCP](https://modelcontextprotocol.io/) (Model Context Protocol) endpoint. When Zudoku detects this
extension, it replaces the standard request/response view with a dedicated MCP card showing the
endpoint URL, a copy button, and tabbed installation instructions for popular AI clients.

:::note

The `x-mcp-server` extension is applied at the **operation level** to mark specific endpoints. If
you want to describe an entire MCP server at the root level of your OpenAPI document, see the
[`x-mcp` extension](./x-mcp).

:::

## Location

The `x-mcp-server` extension is added at the **Operation Object** level.

| Option         | Type                             | Description                                    |
| -------------- | -------------------------------- | ---------------------------------------------- |
| `x-mcp-server` | `boolean` or `MCP Server Object` | Marks the operation as an MCP server endpoint. |

## MCP Server Object

When using the object form, the following properties are available:

| Property  | Type            | Required | Description                                                                                                                  |
| --------- | --------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`        | No       | Display name used in the generated client configuration snippets. Falls back to the operation `summary`, then `"mcp-server"` |
| `version` | `string`        | No       | Version metadata                                                                                                             |
| `tools`   | `[Tool Object]` | No       | Array of tools provided by the MCP server                                                                                    |

Each item in the `tools` array:

| Property      | Type     | Required | Description                     |
| ------------- | -------- | -------- | ------------------------------- |
| `name`        | `string` | Yes      | Tool name                       |
| `description` | `string` | No       | Human-readable tool description |

## MCP URL resolution

The displayed MCP URL is constructed from the **server URL** of the API and the **path** of the
operation. The server URL comes from the OpenAPI `servers` array (or the operation-level `servers`
override if present).

## Examples

### Boolean shorthand

Use `true` to enable MCP UI without specifying metadata. The operation's `summary` is used as the
server name.

```yaml
paths:
  /mcp:
    post:
      summary: My MCP Server
      x-mcp-server: true
      responses:
        "200":
          description: MCP response
```

### Object form

```yaml
paths:
  /mcp:
    post:
      summary: My MCP Server
      x-mcp-server:
        name: my-mcp-server
        version: 1.0.0
        tools:
          - name: search_docs
            description: Search the documentation
          - name: get_page
            description: Retrieve a specific documentation page
      responses:
        "200":
          description: MCP response
```

## Generated UI

When detected, the operation page shows:

- **MCP Endpoint card** with the full URL and a copy button
- **AI Tool Configuration** tabs with setup instructions for:
  - **Claude** — add via Connectors UI or `claude mcp add` CLI command
  - **ChatGPT** — app setup via Settings → Apps → Advanced Settings
  - **Cursor** — `mcp.json` configuration (global or project-level)
  - **VS Code** — `.vscode/mcp.json` with native HTTP transport for GitHub Copilot
  - **Generic** — standard `mcp.json` format compatible with most MCP clients

The standard method badge, request body, parameters, and sidecar panels are hidden for MCP
endpoints.

For a full walkthrough including Zudoku configuration, see the
[Documenting MCP Servers guide](/docs/guides/mcp-servers).
