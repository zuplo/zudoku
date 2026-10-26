import { describe, expect, it } from "vitest";
import {
  createGraphQLServer,
  getAllOperations,
  getAllSlugs,
  getAllTags,
  type OpenAPIDocument,
} from "./index.js";

const createTestSchema = (paths: Record<string, unknown>): OpenAPIDocument =>
  ({
    openapi: "3.1.0",
    info: { title: "Test API", version: "1.0.0" },
    paths,
    components: {},
  }) as OpenAPIDocument;

const queryOperations = async (schema: OpenAPIDocument) => {
  const server = createGraphQLServer();
  const operations = getAllOperations(schema.paths);
  const slugs = getAllSlugs(operations, schema.tags);
  const tags = getAllTags(schema);

  const response = await server.fetch(
    new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            tags { operations { path method isMcpServer } }
          }
        }`,
        variables: { input: schema, type: "raw" },
      }),
    }),
    { schema, operations, slugs, tags },
  );

  const result = await response.json();
  if (result.errors) {
    throw new Error(JSON.stringify(result.errors, null, 2));
  }
  return result.data.schema.tags.flatMap(
    (tag: { operations: unknown[] }) => tag.operations,
  );
};

describe("isMcpServer", () => {
  it("is true for operations carrying x-mcp-server", async () => {
    const operations = await queryOperations(
      createTestSchema({
        "/v1/mcp": {
          post: {
            summary: "MCP server",
            "x-mcp-server": { name: "Test MCP", tools: [] },
            responses: {},
          },
        },
      }),
    );

    expect(operations).toEqual([
      { path: "/v1/mcp", method: "post", isMcpServer: true },
    ]);
  });

  it("is false for regular operations", async () => {
    const operations = await queryOperations(
      createTestSchema({
        "/v1/servers": { get: { summary: "List servers", responses: {} } },
      }),
    );

    expect(operations).toEqual([
      { path: "/v1/servers", method: "get", isMcpServer: false },
    ]);
  });
});
