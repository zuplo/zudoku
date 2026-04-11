import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { OpenAPIDocument } from "../lib/oas/parser/index.js";
import { removeExtensions } from "../lib/plugins/openapi/processors/removeExtensions.js";
import { removePaths } from "../lib/plugins/openapi/processors/removePaths.js";
import { enrichWithZuploMcpServerData } from "./enrich-with-zuplo-mcp.js";

describe("enrichWithZuploMcpServerData", () => {
  let tempDir: string;
  let rootDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-mcp-test-"));
    // rootDir is a subdirectory because the enrichment resolves files
    // relative to path.resolve(rootDir, "../", fileConfig.path)
    rootDir = path.join(tempDir, "config");
    await fs.mkdir(rootDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const createReferencedApiFile = async (filePath: string) => {
    const apiSchema = {
      openapi: "3.1.0",
      info: { title: "Referenced API", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "getUsers",
            summary: "Get all users",
            description: "Retrieve all users from the system",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };
    await fs.writeFile(filePath, JSON.stringify(apiSchema));
  };

  it("should set x-mcp-server on operations with mcpServerHandler", async () => {
    const apiFilePath = path.join(tempDir, "api.json");
    await createReferencedApiFile(apiFilePath);
    // rootDir/../api.json should resolve to tempDir/api.json

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcpEndpoint",
            "x-zuplo-route": {
              handler: {
                export: "mcpServerHandler",
                options: {
                  files: [
                    {
                      path: "api.json",
                      operationIds: ["getUsers"],
                    },
                  ],
                },
              },
            },
            responses: { "200": { description: "MCP response" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    const processor = enrichWithZuploMcpServerData({ rootDir });
    const result = await processor({
      schema,
      file: "test.json",
      params: {},
      dereference: async (s) => s,
    });

    const mcpOperation = result.paths?.["/mcp"]?.post as Record<string, any>;
    expect(mcpOperation?.["x-mcp-server"]).toBeDefined();
    expect(mcpOperation["x-mcp-server"].name).toBe("MCP Server");
    expect(mcpOperation["x-mcp-server"].tools).toHaveLength(1);
    expect(mcpOperation["x-mcp-server"].tools[0].name).toBe("getUsers");
  });

  it("should preserve x-mcp-server after removeExtensions strips x-zuplo-*", async () => {
    const apiFilePath = path.join(tempDir, "api.json");
    await createReferencedApiFile(apiFilePath);
    // rootDir/../api.json should resolve to tempDir/api.json

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcpEndpoint",
            "x-zuplo-route": {
              handler: {
                export: "mcpServerHandler",
                options: {
                  files: [
                    {
                      path: "api.json",
                      operationIds: ["getUsers"],
                    },
                  ],
                },
              },
            },
            responses: { "200": { description: "MCP response" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    // Run enrichment
    const enrichProcessor = enrichWithZuploMcpServerData({ rootDir });
    const enriched = await enrichProcessor({
      schema,
      file: "test.json",
      params: {},
      dereference: async (s) => s,
    });

    // Run removeExtensions (should strip x-zuplo-* but keep x-mcp-server)
    const cleanProcessor = removeExtensions({
      shouldRemove: (key) => key.startsWith("x-zuplo"),
    });
    const cleaned = cleanProcessor({
      schema: enriched,
      file: "test.json",
      params: {},
      dereference: async (s) => s,
    });

    const mcpOperation = cleaned.paths?.["/mcp"]?.post as Record<string, any>;
    expect(mcpOperation?.["x-mcp-server"]).toBeDefined();
    expect(mcpOperation["x-mcp-server"].name).toBe("MCP Server");
    // x-zuplo-route should be removed
    expect(mcpOperation["x-zuplo-route"]).toBeUndefined();
  });

  it("should preserve x-mcp-server through full processor chain", async () => {
    const apiFilePath = path.join(tempDir, "api.json");
    await createReferencedApiFile(apiFilePath);
    // rootDir/../api.json should resolve to tempDir/api.json

    const schema = {
      openapi: "3.1.0",
      info: { title: "Test MCP API", version: "1.0.0" },
      paths: {
        "/mcp": {
          post: {
            summary: "MCP Server",
            operationId: "mcpEndpoint",
            "x-zuplo-route": {
              handler: {
                export: "mcpServerHandler",
                options: {
                  files: [
                    {
                      path: "api.json",
                      operationIds: ["getUsers"],
                    },
                  ],
                },
              },
            },
            responses: { "200": { description: "MCP response" } },
          },
        },
        "/users": {
          get: {
            summary: "Get Users",
            operationId: "getUsers",
            "x-internal": true,
            responses: { "200": { description: "OK" } },
          },
        },
      },
    } as unknown as OpenAPIDocument;

    const processorArg = (s: OpenAPIDocument) => ({
      schema: s,
      file: "test.json",
      params: {},
      dereference: async (s: OpenAPIDocument) => s,
    });

    // 1. removePaths (remove x-internal operations)
    let result = removePaths({
      shouldRemove: ({ operation }) => operation["x-internal"],
    })(processorArg(schema));

    // Verify internal operations were removed but MCP path kept
    expect(result.paths?.["/users"]?.get).toBeUndefined();
    expect(result.paths?.["/mcp"]).toBeDefined();

    // 2. enrichWithZuploMcpServerData
    const enrichProcessor = enrichWithZuploMcpServerData({ rootDir });
    result = await enrichProcessor(processorArg(result));

    // 3. removeExtensions (strip x-zuplo-*)
    result = removeExtensions({
      shouldRemove: (key) => key.startsWith("x-zuplo"),
    })(processorArg(result));

    // Verify x-mcp-server survived the full pipeline
    const mcpOperation = result.paths?.["/mcp"]?.post as Record<string, any>;
    expect(mcpOperation?.["x-mcp-server"]).toBeDefined();
    expect(mcpOperation["x-mcp-server"].name).toBe("MCP Server");
    expect(mcpOperation["x-mcp-server"].tools).toHaveLength(1);

    // Verify x-zuplo-route was removed
    expect(mcpOperation["x-zuplo-route"]).toBeUndefined();
  });
});
