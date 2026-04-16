---
title: x-mcp
sidebar_icon: bot
---

Use `x-mcp` to document [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) servers for
API consumers. This extension describes the MCP server capabilities, tools, resources, and prompts
directly in your OpenAPI description.

:::note

The `x-mcp` extension describes MCP server metadata at the **root level** of an OpenAPI document. If
you are looking to mark individual operations as MCP endpoints, see the
[`x-mcp-server` guide](/docs/guides/mcp-servers).

:::

## Location

The `x-mcp` extension is added at the **Root Object** level — the outermost level of the OpenAPI
description.

| Option  | Type       | Description                              |
| ------- | ---------- | ---------------------------------------- |
| `x-mcp` | MCP Object | MCP server description and configuration |

## MCP Object

| Property          | Type                  | Required | Description                                                                                   |
| ----------------- | --------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `protocolVersion` | `string`              | Yes      | The MCP protocol version supported by the server.                                             |
| `servers`         | `[Server Object]`     | No       | A list of server objects used to add one or more target endpoints for the MCP server.         |
| `capabilities`    | `Capabilities Object` | No       | Server capabilities including supported features like logging, prompts, resources, and tools. |
| `tools`           | `[Tool Object]`       | No       | Array of tools provided by the MCP server.                                                    |
| `resources`       | `[Resource Object]`   | No       | Array of resources provided by the MCP server.                                                |
| `prompts`         | `[Prompt Object]`     | No       | Array of prompts provided by the MCP server.                                                  |

## Capabilities Object

| Property    | Type     | Description                                                                                         |
| ----------- | -------- | --------------------------------------------------------------------------------------------------- |
| `logging`   | `object` | Logging capabilities configuration. Empty object indicates basic logging support.                   |
| `prompts`   | `object` | Prompt capabilities configuration with optional `listChanged` boolean property.                     |
| `resources` | `object` | Resource capabilities configuration with optional `subscribe` and `listChanged` boolean properties. |
| `tools`     | `object` | Tool capabilities configuration with optional `listChanged` boolean property.                       |

## Tool Object

| Property       | Type                 | Required | Description                                                                     |
| -------------- | -------------------- | -------- | ------------------------------------------------------------------------------- |
| `name`         | `string`             | Yes      | The name of the tool.                                                           |
| `title`        | `string`             | No       | Title of the tool.                                                              |
| `description`  | `string`             | Yes      | Description of what the tool does.                                              |
| `tags`         | `[string]`           | No       | Tags for the tool.                                                              |
| `inputSchema`  | `object`             | No       | JSON Schema describing the expected input parameters for the tool.              |
| `outputSchema` | `object` or `string` | No       | JSON Schema describing the tool's output, or a reference to a schema component. |
| `security`     | `[object]`           | No       | Security requirements for the tool, following OpenAPI security scheme format.   |

## Resource Object

| Property      | Type     | Required | Description                              |
| ------------- | -------- | -------- | ---------------------------------------- |
| `name`        | `string` | Yes      | The name of the resource.                |
| `description` | `string` | No       | Description of the resource.             |
| `uri`         | `string` | No       | URI template for accessing the resource. |
| `mimeType`    | `string` | No       | MIME type of the resource content.       |

## Prompt Object

| Property      | Type                | Required | Description                        |
| ------------- | ------------------- | -------- | ---------------------------------- |
| `name`        | `string`            | Yes      | The name of the prompt.            |
| `title`       | `string`            | No       | Title of the prompt.               |
| `description` | `string`            | No       | Description of the prompt.         |
| `arguments`   | `[Argument Object]` | No       | Array of arguments for the prompt. |

### Argument Object

| Property      | Type      | Required | Description                       |
| ------------- | --------- | -------- | --------------------------------- |
| `name`        | `string`  | Yes      | The name of the argument.         |
| `description` | `string`  | No       | Description of the argument.      |
| `required`    | `boolean` | No       | Whether the argument is required. |

## Example

The following example shows an OpenAPI description with an `x-mcp` extension that defines an MCP
server with OAuth2 security, multiple tools, and schema components:

```yaml
openapi: 3.2.0
info:
  version: 1.0.0
  title: API Clients MCP
  license:
    name: MIT
servers:
  - url: http://localhost:8080/mcp

paths: {}

x-mcp:
  protocolVersion: "2025-06-18"
  capabilities:
    logging: {}
    prompts:
      listChanged: true
    resources:
      subscribe: true
    tools:
      listChanged: true
  tools:
    - name: clients/get
      description: Get a list of clients with all scopes in a service domain.
      inputSchema:
        type: object
        properties:
          clientId:
            type: string
            description: The ID of the client to get.
      outputSchema:
        $ref: "#/components/schemas/Client"
      security:
        - OAuth2:
            scopes:
              read: Read access
    - name: clients/list
      description: Get a list of clients with all scopes in a service domain.
      inputSchema:
        type: object
        properties:
          paginationToken:
            type: string
            description: The pagination token to get the next page of clients.
      outputSchema:
        type: object
        properties:
          clients:
            type: array
            items:
              $ref: "#/components/schemas/Client"
          paginationToken:
            type: string
            description: The pagination token to get the next page of clients.
  resources: []

components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: http://localhost:8080/mcp/token
          scopes:
            read: Read access
            write: Write access
  schemas:
    Client:
      type: object
      properties:
        clientId:
          type: number
          description: The ID of the client.
        scopes:
          type: array
          items:
            type: string
          description: The scopes of the client.
      required:
        - clientId
        - scopes
```
