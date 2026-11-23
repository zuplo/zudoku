import { describe, expect, it } from "vitest";
import {
  createGraphQLServer,
  getAllOperations,
  getAllSlugs,
  getAllTags,
  type OpenAPIDocument,
} from "./index.js";

const createTestSchema = (
  openapi: string,
  responses: Record<string, unknown>,
  components: Record<string, unknown> = {},
): OpenAPIDocument =>
  ({
    openapi,
    info: { title: "Test API", version: "1.0.0" },
    paths: { "/pets": { put: { summary: "Update pet", responses } } },
    components,
  }) as OpenAPIDocument;

const queryResponses = async (schema: OpenAPIDocument) => {
  const server = createGraphQLServer();
  const operations = getAllOperations(schema.paths);

  const response = await server.fetch(
    new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query ($input: JSON!, $type: SchemaType!) {
          schema(input: $input, type: $type) {
            tags {
              operations {
                responses {
                  statusCode
                  headers {
                    name
                    description
                    required
                    deprecated
                    style
                    explode
                    schema
                    examples { name value }
                  }
                }
              }
            }
          }
        }`,
        variables: { input: schema, type: "raw" },
      }),
    }),
    {
      schema,
      operations,
      slugs: getAllSlugs(operations, schema.tags),
      tags: getAllTags(schema),
    },
  );

  const result = await response.json();
  if (result.errors) {
    throw new Error(JSON.stringify(result.errors, null, 2));
  }
  return result.data.schema.tags[0].operations[0].responses;
};

describe("response headers", () => {
  it("returns an empty list when a response has no headers", async () => {
    const responses = await queryResponses(
      createTestSchema("3.1.0", { "204": { description: "No content" } }),
    );

    expect(responses).toEqual([{ statusCode: "204", headers: [] }]);
  });

  it("resolves inline and $ref'd headers", async () => {
    const responses = await queryResponses(
      createTestSchema(
        "3.1.0",
        {
          "200": {
            description: "OK",
            headers: {
              ETag: { $ref: "#/components/headers/ETag" },
              Location: {
                required: true,
                schema: { type: "string", format: "uri" },
              },
            },
          },
        },
        {
          headers: {
            ETag: {
              description: "The entity tag",
              deprecated: true,
              schema: { type: "string" },
            },
          },
        },
      ),
    );

    expect(responses[0].headers).toEqual([
      {
        name: "ETag",
        description: "The entity tag",
        required: null,
        deprecated: true,
        style: null,
        explode: null,
        schema: { type: "string" },
        examples: [],
      },
      {
        name: "Location",
        description: null,
        required: true,
        deprecated: null,
        style: null,
        explode: null,
        schema: { type: "string", format: "uri" },
        examples: [],
      },
    ]);
  });

  it("ignores the Content-Type header", async () => {
    const responses = await queryResponses(
      createTestSchema("3.1.0", {
        "200": {
          description: "OK",
          headers: {
            "content-type": { schema: { type: "string" } },
            "X-Rate-Limit": { schema: { type: "integer" } },
          },
        },
      }),
    );

    expect(responses[0].headers.map((h: { name: string }) => h.name)).toEqual([
      "X-Rate-Limit",
    ]);
  });

  it("falls back to the schema of a header's content map", async () => {
    const responses = await queryResponses(
      createTestSchema("3.1.0", {
        "200": {
          description: "OK",
          headers: {
            "X-Meta": {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { id: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      }),
    );

    expect(responses[0].headers[0].schema).toEqual({
      type: "object",
      properties: { id: { type: "string" } },
    });
  });

  it("exposes OAS 3.0 header examples", async () => {
    const responses = await queryResponses(
      createTestSchema("3.0.3", {
        "200": {
          description: "OK",
          headers: {
            "X-Request-Id": { schema: { type: "string" }, example: "abc-123" },
          },
        },
      }),
    );

    expect(responses[0].headers[0].examples).toEqual([
      { name: "default", value: "abc-123" },
    ]);
  });
});
