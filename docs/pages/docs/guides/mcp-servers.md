---
title: Documenting MCP Servers
sidebar_icon: bot
zuplo: false
---

Zudoku can render a dedicated [MCP](https://modelcontextprotocol.io/) endpoint UI for any OpenAPI
operation that has the `x-mcp-server` extension. When detected, the operation page replaces the
standard request/response view with an MCP card showing the endpoint URL, a copy button, and tabbed
installation instructions for Claude, ChatGPT, Cursor, VS Code, and a generic config.

## Adding the extension

Add the `x-mcp-server` extension to an operation in your OpenAPI spec. While MCP servers typically
use `POST`, the extension works on any HTTP method:

```json title="openapi.json (paths section)"
{
  "paths": {
    "/mcp": {
      "post": {
        "summary": "My MCP Server",
        "description": "MCP endpoint for querying documentation.",
        "operationId": "mcpEndpoint",
        "x-mcp-server": {
          "name": "my-mcp-server",
          "version": "1.0.0",
          "tools": [
            {
              "name": "search_docs",
              "description": "Search the documentation"
            },
            {
              "name": "get_page",
              "description": "Retrieve a specific documentation page"
            }
          ]
        },
        "responses": {
          "200": {
            "description": "MCP response"
          }
        }
      }
    }
  }
}
```

The UI will display beneath the operation heading, showing the full MCP URL derived from the server
URL and the operation path.

You can also use the shorthand `"x-mcp-server": true` to enable the MCP UI without specifying any
metadata. In this case, the operation's `summary` is used as the server name.

## Extension properties

| Property  | Type     | Required | Description                                                                                                                  |
| --------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string` | No       | Display name used in the generated client configuration snippets. Falls back to the operation `summary`, then `"mcp-server"` |
| `version` | `string` | No       | Version metadata (included for completeness; not currently rendered in UI)                                                   |
| `tools`   | `array`  | No       | Tools metadata (used by Zuplo enrichment; not currently rendered in UI)                                                      |

Each tool in the `tools` array has:

| Property      | Type     | Required | Description                     |
| ------------- | -------- | -------- | ------------------------------- |
| `name`        | `string` | Yes      | Tool name                       |
| `description` | `string` | No       | Human-readable tool description |

## MCP URL resolution

The displayed MCP URL is constructed from the **server URL** of the API and the **path** of the
operation. The server URL comes from the OpenAPI `servers` array (or the operation-level `servers`
override if present).

For example, with this configuration:

```json
{
  "servers": [{ "url": "https://api.example.com" }],
  "paths": {
    "/mcp/docs": {
      "post": {
        "x-mcp-server": { "name": "docs-mcp" },
        "responses": { "200": { "description": "OK" } }
      }
    }
  }
}
```

The displayed MCP URL will be `https://api.example.com/mcp/docs`.

## Complete example

This is a minimal but complete OpenAPI spec that produces an MCP endpoint page:

```json title="mcp-api.json"
{
  "openapi": "3.0.3",
  "info": {
    "title": "Documentation MCP Server",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://api.example.com",
      "description": "Production"
    }
  ],
  "paths": {
    "/mcp": {
      "post": {
        "tags": ["MCP"],
        "summary": "Documentation MCP Server",
        "description": "MCP endpoint powered by Inkeep for searching and querying documentation.",
        "operationId": "mcpEndpoint",
        "x-mcp-server": {
          "name": "example-docs",
          "version": "1.0.0",
          "tools": [
            {
              "name": "search_docs",
              "description": "Search the documentation"
            }
          ]
        },
        "responses": {
          "200": {
            "description": "MCP response"
          }
        }
      }
    }
  }
}
```

Then reference this spec in your Zudoku config (see
[API Reference](/docs/configuration/api-reference) for full `apis` configuration):

```tsx title="zudoku.config.tsx"
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  apis: [
    {
      type: "file",
      input: "./mcp-api.json",
      path: "mcp",
    },
  ],
  navigation: [
    {
      type: "link",
      label: "MCP Server",
      to: "/mcp",
      icon: "bot",
    },
  ],
};

export default config;
```

You can see a live example of this in the
[Cosmo Cargo demo](https://www.cosmocargo.dev/catalog/api-ai-cargo/ai-operations#universal-mcp-endpoint).

## Generated UI

When Zudoku detects the `x-mcp-server` extension on an operation, the page shows:

- **MCP Endpoint card** with the full URL and a copy button
- **AI Tool Configuration** tabs with setup instructions for:
  - **Claude** — add via Connectors UI or `claude mcp add` CLI command
  - **ChatGPT** — app setup via Settings → Apps → Advanced Settings
  - **Cursor** — `mcp.json` configuration (global or project-level)
  - **VS Code** — `.vscode/mcp.json` with native HTTP transport for GitHub Copilot
  - **Generic** — standard `mcp.json` format compatible with most MCP clients

The standard method badge, request body, parameters, and sidecar panels are hidden for MCP endpoints
since they use a different interaction model.

## Using with Zuplo

If you are using [Zuplo](https://zuplo.com) to host your API, the `x-mcp-server` extension is
automatically added to POST operations that use the `mcpServerHandler`. No manual schema changes are
needed. See the [Zuplo MCP documentation](https://zuplo.com/docs/handlers/mcp-handler) for details.
