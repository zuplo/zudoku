import { describe, expect, it } from "vitest";
import { upgradeOpenApi } from "../../../vite/api/upgradeOpenApi.js";
import {
  createGraphQLServer,
  getAllOperations,
  getAllSlugs,
  getAllTags,
} from "./index.js";

// Runs a document through the same steps as file-backed schemas: upgrade
// (a no-op for OAS 3.1) and resolution via a schema import
const queryParameters = async (raw: Record<string, unknown>) => {
  const schema = upgradeOpenApi(structuredClone(raw));
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
                parameters {
                  name
                  examples { name value hasValue externalValue }
                }
              }
            }
          }
        }`,
        variables: { input: "shipments", type: "file" },
      }),
    }),
    {
      schema,
      operations,
      slugs: getAllSlugs(operations, schema.tags),
      tags: getAllTags(schema),
      schemaImports: { shipments: async () => ({ schema }) },
    },
  );

  const result = await response.json();
  if (result.errors) {
    throw new Error(JSON.stringify(result.errors, null, 2));
  }
  return result.data.schema.tags[0].operations[0].parameters;
};

const createDocument = (openapi: string, parameters: unknown[]) => ({
  openapi,
  info: { title: "Cosmo Cargo", version: "1.0.0" },
  paths: {
    "/shipments": {
      get: { parameters, responses: { "200": { description: "OK" } } },
    },
  },
});

describe("parameter examples", () => {
  it("exposes a singular example of an OAS 3.1 file schema", async () => {
    const parameters = await queryParameters(
      createDocument("3.1.0", [
        {
          in: "query",
          name: "warpLane",
          schema: { type: "string" },
          example: "quantum-7",
        },
      ]),
    );

    expect(parameters[0].examples).toEqual([
      { name: "", value: "quantum-7", hasValue: true, externalValue: null },
    ]);
  });

  it("exposes a singular example of an upgraded OAS 3.0 file schema", async () => {
    const parameters = await queryParameters(
      createDocument("3.0.3", [
        {
          in: "query",
          name: "warpLane",
          schema: { type: "string" },
          example: "quantum-7",
        },
      ]),
    );

    expect(parameters[0].examples).toEqual([
      {
        name: "default",
        value: "quantum-7",
        hasValue: true,
        externalValue: null,
      },
    ]);
  });

  it("tells explicit null values apart from missing values", async () => {
    const parameters = await queryParameters(
      createDocument("3.1.0", [
        {
          in: "query",
          name: "dockingBay",
          schema: { type: ["string", "null"] },
          examples: {
            none: { value: null },
            external: { externalValue: "https://cosmocargo.space/bay.json" },
          },
        },
      ]),
    );

    expect(parameters[0].examples).toEqual([
      { name: "none", value: null, hasValue: true, externalValue: null },
      {
        name: "external",
        value: null,
        hasValue: false,
        externalValue: "https://cosmocargo.space/bay.json",
      },
    ]);
  });
});
