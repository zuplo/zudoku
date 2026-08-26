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
| `url`     | `string`        | No       | Overrides the endpoint URL shown in the card and install snippets. See [MCP URL resolution](#mcp-url-resolution)             |
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

### Overriding the URL

Set `url` on `x-mcp-server` when the MCP server is not reachable under the documented API server —
for example when it runs on its own hostname:

```yaml
servers:
  - url: https://api.example.com
paths:
  /mcp:
    post:
      summary: My MCP Server
      x-mcp-server:
        name: my-mcp-server
        url: https://mcp.example.com/mcp
      responses:
        "200":
          description: MCP response
```

The card and every install snippet then use `https://mcp.example.com/mcp` instead of
`https://api.example.com/mcp`.

An absolute `url` (one with a scheme, such as `https://`) replaces the endpoint entirely and is used
verbatim — it also takes precedence over the server picked in the server dropdown, since it names a
host of its own. A value without a scheme is treated as a path on the server URL instead, so
`url: /v2/mcp` resolves to `https://api.example.com/v2/mcp` and still follows server selection.
Blank values are ignored and the URL falls back to the server URL plus the operation path.

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

When the extension carries `security` and `securitySchemes`, the card also documents the credential
header and adds it to every install snippet. Set the
[`disableMcpAuthInstructions`](/docs/configuration/api-reference#options) API option to render the
server as unauthenticated instead.

For a full walkthrough including Zudoku configuration, see the
[Documenting MCP Servers guide](/docs/guides/mcp-servers).

If a document describes several MCP servers, mark it with
[`x-zudoku-type: mcp-catalog`](./x-zudoku-type) to render them as a searchable catalog instead of
individual operation pages.
