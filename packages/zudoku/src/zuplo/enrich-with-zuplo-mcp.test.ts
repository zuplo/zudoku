import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { OpenAPIDocument } from "../lib/oas/parser/index.js";
import { removeExtensions } from "../lib/plugins/openapi/processors/removeExtensions.js";
import { removePaths } from "../lib/plugins/openapi/processors/removePaths.js";
import { enrichWithZuploMcpServerData } from "./enrich-with-zuplo-mcp.js";

const mcpRouteHandler = (operations: Array<{ file: string; id: string }>) => ({
  "x-zuplo-route": {
    corsPolicy: "none",
    handler: {
      export: "mcpServerHandler",
      module: "$import(@zuplo/runtime)",
      options: { operations },
    },
    policies: { inbound: [] },
  },
});

describe("enrichWithZuploMcpServerData", () => {
  let tempDir: string;
  let rootDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-mcp-test-"));
    // rootDir is a subdirectory because the enrichment resolves files
    // relative to path.resolve(rootDir, "../", file)
    rootDir = path.join(tempDir, "config");
    await fs.mkdir(path.join(tempDir, "config", "routes"), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const writeApiFile = (relativePath: string, schema: object) =>
    fs.writeFile(path.join(tempDir, relativePath), JSON.stringify(schema));

  const processorArg = (s: OpenAPIDocument) => ({
    schema: s,
    file: "test.json",
    params: {},
    dereference: async (s: OpenAPIDocument) => s,
  });

  it("should set x-mcp-server on operations with mcpServerHandler", async () => {
    await writeApiFile("config/routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "Routes API", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "get-users",
            summary: "Get all users",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcp-endpoint",
            ...mcpRouteHandler([
              { file: "./config/routes.oas.json", id: "get-users" },
            ]),
            responses: { "200": { description: "MCP response" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    const result = await enrichWithZuploMcpServerData({ rootDir })(
      processorArg(schema),
    );

    // biome-ignore lint/suspicious/noExplicitAny: test assertion
    const op = result.paths?.["/mcp"]?.post as Record<string, any>;
    expect(op?.["x-mcp-server"]).toBeDefined();
    expect(op["x-mcp-server"].name).toBe("MCP Server");
    expect(op["x-mcp-server"].tools).toHaveLength(1);
    expect(op["x-mcp-server"].tools[0].name).toBe("get-users");
  });

  it("should group operations from the same file", async () => {
    await writeApiFile("config/routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "Routes API", version: "1.0.0" },
      paths: {
        "/todos/{id}": {
          put: {
            operationId: "update-todo",
            summary: "Update a todo",
            responses: { "200": { description: "OK" } },
          },
          delete: {
            operationId: "delete-todo",
            summary: "Delete a todo",
            responses: { "200": { description: "OK" } },
          },
        },
        "/todos": {
          post: {
            operationId: "create-todo",
            summary: "Create a todo",
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcp-endpoint",
            ...mcpRouteHandler([
              { file: "./config/routes.oas.json", id: "update-todo" },
              { file: "./config/routes.oas.json", id: "delete-todo" },
              { file: "./config/routes.oas.json", id: "create-todo" },
            ]),
            responses: { "200": { description: "MCP response" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    const result = await enrichWithZuploMcpServerData({ rootDir })(
      processorArg(schema),
    );

    // biome-ignore lint/suspicious/noExplicitAny: test assertion
    const op = result.paths?.["/mcp"]?.post as Record<string, any>;
    expect(op["x-mcp-server"].tools).toHaveLength(3);
    expect(
      op["x-mcp-server"].tools.map((t: { name: string }) => t.name),
    ).toEqual(["update-todo", "delete-todo", "create-todo"]);
  });

  it("should preserve x-mcp-server through full processor chain", async () => {
    await writeApiFile("config/routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "Routes API", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "get-users",
            summary: "Get all users",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcp-endpoint",
            ...mcpRouteHandler([
              { file: "./config/routes.oas.json", id: "get-users" },
            ]),
            responses: { "200": { description: "MCP response" } },
          },
        },
        "/users": {
          get: {
            summary: "Get Users",
            operationId: "get-users",
            "x-internal": true,
            responses: { "200": { description: "OK" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    // 1. removePaths (remove x-internal operations)
    let result = removePaths({
      shouldRemove: ({ operation }) => operation["x-internal"],
    })(processorArg(schema));

    expect(result.paths?.["/users"]?.get).toBeUndefined();
    expect(result.paths?.["/mcp"]).toBeDefined();

    // 2. enrichWithZuploMcpServerData
    result = await enrichWithZuploMcpServerData({ rootDir })(
      processorArg(result),
    );

    // 3. removeExtensions (strip x-zuplo-*)
    result = removeExtensions({
      shouldRemove: (key) => key.startsWith("x-zuplo"),
    })(processorArg(result));

    // biome-ignore lint/suspicious/noExplicitAny: test assertion
    const op = result.paths?.["/mcp"]?.post as Record<string, any>;
    expect(op?.["x-mcp-server"]).toBeDefined();
    expect(op["x-mcp-server"].name).toBe("MCP Server");
    expect(op["x-mcp-server"].tools).toHaveLength(1);
    expect(op["x-zuplo-route"]).toBeUndefined();
  });

  it("should add security to x-mcp-server when referenced operations have security", async () => {
    await writeApiFile("config/routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "Routes API", version: "1.0.0" },
      components: {
        securitySchemes: {
          api_key: { type: "http", scheme: "bearer" },
        },
      },
      paths: {
        "/users": {
          get: {
            operationId: "get-users",
            summary: "Get all users",
            security: [{ api_key: [] }],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcp-endpoint",
            ...mcpRouteHandler([
              { file: "./config/routes.oas.json", id: "get-users" },
            ]),
            responses: { "200": { description: "MCP response" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    const result = await enrichWithZuploMcpServerData({ rootDir })(
      processorArg(schema),
    );

    // biome-ignore lint/suspicious/noExplicitAny: test assertion
    const op = result.paths?.["/mcp"]?.post as Record<string, any>;
    expect(op["x-mcp-server"].security).toEqual([{ api_key: [] }]);

    // Security scheme should be copied to main schema
    expect(result.components?.securitySchemes?.api_key).toEqual({
      type: "http",
      scheme: "bearer",
    });
  });

  it("should inherit doc-level security when operations have none", async () => {
    await writeApiFile("config/routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "Routes API", version: "1.0.0" },
      security: [{ bearer_auth: [] }],
      components: {
        securitySchemes: {
          bearer_auth: { type: "http", scheme: "bearer" },
        },
      },
      paths: {
        "/users": {
          get: {
            operationId: "get-users",
            summary: "Get all users",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcp-endpoint",
            ...mcpRouteHandler([
              { file: "./config/routes.oas.json", id: "get-users" },
            ]),
            responses: { "200": { description: "MCP response" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    const result = await enrichWithZuploMcpServerData({ rootDir })(
      processorArg(schema),
    );

    // biome-ignore lint/suspicious/noExplicitAny: test assertion
    const op = result.paths?.["/mcp"]?.post as Record<string, any>;
    expect(op["x-mcp-server"].security).toEqual([{ bearer_auth: [] }]);
    expect(result.components?.securitySchemes?.bearer_auth).toEqual({
      type: "http",
      scheme: "bearer",
    });
  });

  it("should not add security when no operations have security", async () => {
    await writeApiFile("config/routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "Routes API", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "get-users",
            summary: "Get all users",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcp-endpoint",
            ...mcpRouteHandler([
              { file: "./config/routes.oas.json", id: "get-users" },
            ]),
            responses: { "200": { description: "MCP response" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    const result = await enrichWithZuploMcpServerData({ rootDir })(
      processorArg(schema),
    );

    // biome-ignore lint/suspicious/noExplicitAny: test assertion
    const op = result.paths?.["/mcp"]?.post as Record<string, any>;
    expect(op["x-mcp-server"].security).toBeUndefined();
    expect(result.components?.securitySchemes).toBeUndefined();
  });

  it("should deduplicate security requirements across operations", async () => {
    await writeApiFile("config/routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "Routes API", version: "1.0.0" },
      components: {
        securitySchemes: {
          api_key: { type: "http", scheme: "bearer" },
        },
      },
      paths: {
        "/users": {
          get: {
            operationId: "get-users",
            summary: "Get all users",
            security: [{ api_key: [] }],
            responses: { "200": { description: "OK" } },
          },
          post: {
            operationId: "create-user",
            summary: "Create a user",
            security: [{ api_key: [] }],
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcp-endpoint",
            ...mcpRouteHandler([
              { file: "./config/routes.oas.json", id: "get-users" },
              { file: "./config/routes.oas.json", id: "create-user" },
            ]),
            responses: { "200": { description: "MCP response" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    const result = await enrichWithZuploMcpServerData({ rootDir })(
      processorArg(schema),
    );

    // biome-ignore lint/suspicious/noExplicitAny: test assertion
    const op = result.paths?.["/mcp"]?.post as Record<string, any>;
    // Should be deduplicated to a single entry
    expect(op["x-mcp-server"].security).toEqual([{ api_key: [] }]);
  });

  it("should add default MCP tag when operation has no tags", async () => {
    await writeApiFile("config/routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "Routes API", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "get-users",
            summary: "Get all users",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcp-endpoint",
            ...mcpRouteHandler([
              { file: "./config/routes.oas.json", id: "get-users" },
            ]),
            responses: { "200": { description: "MCP response" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    const result = await enrichWithZuploMcpServerData({ rootDir })(
      processorArg(schema),
    );

    // biome-ignore lint/suspicious/noExplicitAny: test assertion
    const op = result.paths?.["/mcp"]?.post as Record<string, any>;
    expect(op.tags).toEqual(["MCP"]);

    // Top-level tags should include MCP definition
    expect(result.tags).toContainEqual({
      name: "MCP",
      description:
        "Model Context Protocol (MCP) server endpoints for AI tool integration",
    });
  });

  it("should not override existing tags on MCP operation", async () => {
    await writeApiFile("config/routes.oas.json", {
      openapi: "3.1.0",
      info: { title: "Routes API", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "get-users",
            summary: "Get all users",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcp-endpoint",
            tags: ["AI"],
            ...mcpRouteHandler([
              { file: "./config/routes.oas.json", id: "get-users" },
            ]),
            responses: { "200": { description: "MCP response" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    const result = await enrichWithZuploMcpServerData({ rootDir })(
      processorArg(schema),
    );

    // biome-ignore lint/suspicious/noExplicitAny: test assertion
    const op = result.paths?.["/mcp"]?.post as Record<string, any>;
    expect(op.tags).toEqual(["AI"]);

    // Should not add MCP tag definition since it wasn't assigned
    expect(result.tags).toBeUndefined();
  });
});
