import { describe, expect, it } from "vitest";
import {
  createGraphQLServer,
  getAllOperations,
  getAllSlugs,
  getAllTags,
  type OpenAPIDocument,
} from "./index.js";

const createTestSchema = (
  overrides: Partial<OpenAPIDocument> = {},
): OpenAPIDocument =>
  ({
    openapi: "3.1.0",
    info: { title: "Test API", version: "1.0.0" },
    paths: {},
    components: {},
    ...overrides,
  }) as OpenAPIDocument;

const executeQuery = async (schema: OpenAPIDocument, query: string) => {
  const server = createGraphQLServer();
  const operations = getAllOperations(schema.paths);
  const slugs = getAllSlugs(operations, schema.tags);
  const tags = getAllTags(schema);

  const response = await server.fetch(
    new Request("http://localhost/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { input: schema, type: "raw" },
      }),
    }),
    { schema, operations, slugs, tags },
  );

  const result = await response.json();
  if (result.errors) {
    throw new Error(JSON.stringify(result.errors, null, 2));
  }
  return result.data;
};

describe("Server variables GraphQL", () => {
  it("exposes server variables (name/default/enum/description)", async () => {
    const schema = createTestSchema({
      servers: [
        {
          description: "default kind installation",
          url: "http://localhost:9090",
        },
        {
          description:
            "custom server, e.g. for local development.\nNote, that the service must respond to CORS-Requests.",
          url: "{scheme}{host}{port}",
          variables: {
            scheme: { default: "http://" },
            host: { default: "localhost" },
            port: { default: ":80" },
          },
        },
      ],
    });

    const data = await executeQuery(
      schema,
      `query ($input: JSON!, $type: SchemaType!) {
        schema(input: $input, type: $type) {
          servers {
            url
            description
            variables { name default enum description }
          }
        }
      }`,
    );

    expect(data.schema.servers).toEqual([
      {
        url: "http://localhost:9090",
        description: "default kind installation",
        variables: [],
      },
      {
        url: "{scheme}{host}{port}",
        description:
          "custom server, e.g. for local development.\nNote, that the service must respond to CORS-Requests.",
        variables: [
          { name: "scheme", default: "http://", enum: null, description: null },
          { name: "host", default: "localhost", enum: null, description: null },
          { name: "port", default: ":80", enum: null, description: null },
        ],
      },
    ]);
  });

  it("exposes the OAS 3.2+ server `name` field", async () => {
    // OAS 3.2 adds `name`; not yet in our installed openapi-types typings.
    const serverWithName: {
      name?: string;
      description?: string;
      url: string;
      variables?: Record<string, { default: string }>;
    } = {
      name: "local-dev",
      description: "Some **rich** _markdown_ description",
      url: "{scheme}{host}{port}",
      variables: {
        scheme: { default: "http://" },
        host: { default: "localhost" },
        port: { default: ":80" },
      },
    };
    const schema = createTestSchema({ servers: [serverWithName] });

    const data = await executeQuery(
      schema,
      `query ($input: JSON!, $type: SchemaType!) {
        schema(input: $input, type: $type) {
          servers { url name description }
        }
      }`,
    );

    expect(data.schema.servers).toEqual([
      {
        url: "{scheme}{host}{port}",
        name: "local-dev",
        description: "Some **rich** _markdown_ description",
      },
    ]);
  });

  it("returns null for `name` when not present on the server", async () => {
    const schema = createTestSchema({
      servers: [{ url: "http://localhost:9090" }],
    });

    const data = await executeQuery(
      schema,
      `query ($input: JSON!, $type: SchemaType!) {
        schema(input: $input, type: $type) {
          servers { name }
        }
      }`,
    );

    expect(data.schema.servers[0].name).toBeNull();
  });

  it("exposes enum values on a server variable", async () => {
    const schema = createTestSchema({
      servers: [
        {
          url: "https://{region}.example.com",
          variables: {
            region: {
              default: "us",
              enum: ["us", "eu", "apac"],
              description: "Deployment region",
            },
          },
        },
      ],
    });

    const data = await executeQuery(
      schema,
      `query ($input: JSON!, $type: SchemaType!) {
        schema(input: $input, type: $type) {
          servers { variables { name default enum description } }
        }
      }`,
    );

    expect(data.schema.servers[0].variables).toEqual([
      {
        name: "region",
        default: "us",
        enum: ["us", "eu", "apac"],
        description: "Deployment region",
      },
    ]);
  });
});
