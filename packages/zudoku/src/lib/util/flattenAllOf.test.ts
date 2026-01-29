import type { JSONSchema7 } from "json-schema";
import { describe, expect, it, vi } from "vitest";
import type { OpenAPIDocument } from "../oas/parser/index.js";
import { flattenAllOf } from "./flattenAllOf.js";
import { flattenAllOfProcessor } from "./flattenAllOfProcessor.js";
import invariant from "./invariant.js";

describe("flattenAllOf", () => {
  it("should merge two simple schemas", () => {
    const schema = {
      allOf: [
        { type: "object", properties: { id: { type: "string" } } },
        { type: "object", properties: { name: { type: "string" } } },
      ],
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    expect(result).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    });
    expect(result).not.toHaveProperty("allOf");
  });

  it("should merge nested allOf chains", () => {
    const schema = {
      allOf: [
        {
          allOf: [
            { type: "object", properties: { id: { type: "string" } } },
            { type: "object", properties: { name: { type: "string" } } },
          ],
        },
        { type: "object", properties: { email: { type: "string" } } },
      ],
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    expect(result).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
      },
    });
    expect(result).not.toHaveProperty("allOf");
  });

  it("should recursively flatten allOf in nested properties", () => {
    const schema = {
      type: "object",
      properties: {
        user: {
          allOf: [
            { type: "object", properties: { id: { type: "string" } } },
            { type: "object", properties: { name: { type: "string" } } },
          ],
        },
      },
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    invariant(
      typeof result === "object" && result.properties,
      "Result is not a schema",
    );

    expect(result.properties?.user).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    });
    expect(result.properties.user).not.toHaveProperty("allOf");
  });

  it("should flatten allOf in array items", () => {
    const schema = {
      type: "array",
      items: {
        allOf: [
          { type: "object", properties: { id: { type: "string" } } },
          { type: "object", properties: { name: { type: "string" } } },
        ],
      },
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    invariant(
      typeof result === "object" && result.items,
      "Result is not a schema",
    );

    expect(result.items).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    });
    expect(result.items).not.toHaveProperty("allOf");
  });

  it("should flatten allOf in tuple items", () => {
    const schema = {
      type: "array",
      items: [
        {
          allOf: [
            { type: "object", properties: { id: { type: "string" } } },
            { type: "object", properties: { name: { type: "string" } } },
          ],
        },
        { type: "string" },
      ],
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    invariant(
      typeof result === "object" && Array.isArray(result.items),
      "Result is not a schema",
    );

    expect(result.items[0]).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    });
    expect(result.items[0]).not.toHaveProperty("allOf");
    expect(result.items[1]).toEqual({ type: "string" });
  });

  it("should flatten allOf in additionalProperties", () => {
    const schema = {
      type: "object",
      additionalProperties: {
        allOf: [
          { type: "object", properties: { id: { type: "string" } } },
          { type: "object", properties: { name: { type: "string" } } },
        ],
      },
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    invariant(
      typeof result === "object" && result.additionalProperties,
      "Result is not a schema",
    );

    expect(result.additionalProperties as JSONSchema7).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    });
    expect(result.additionalProperties).not.toHaveProperty("allOf");
  });

  it("should flatten allOf within anyOf", () => {
    const schema = {
      anyOf: [
        {
          allOf: [
            { type: "object", properties: { id: { type: "string" } } },
            { type: "object", properties: { name: { type: "string" } } },
          ],
        },
        { type: "string" },
      ],
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    invariant(
      typeof result === "object" && result.anyOf,
      "Result is not a schema",
    );

    expect(result.anyOf[0]).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    });
    expect(result.anyOf[0]).not.toHaveProperty("allOf");
    expect(result.anyOf[1]).toEqual({ type: "string" });
  });

  it("should flatten allOf within oneOf", () => {
    const schema = {
      oneOf: [
        {
          allOf: [
            { type: "object", properties: { id: { type: "string" } } },
            { type: "object", properties: { name: { type: "string" } } },
          ],
        },
        { type: "string" },
      ],
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    invariant(
      typeof result === "object" && result.oneOf,
      "Result is not a schema",
    );

    expect(result.oneOf[0]).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    });
    expect(result.oneOf[0]).not.toHaveProperty("allOf");
    expect(result.oneOf[1]).toEqual({ type: "string" });
  });

  it("should handle schemas without allOf", () => {
    const schema = { type: "string" } as JSONSchema7;
    expect(flattenAllOf(schema)).toEqual({ type: "string" });

    const objectSchema = {
      type: "object",
      properties: { id: { type: "string" } },
    } as JSONSchema7;
    expect(flattenAllOf(objectSchema)).toEqual(objectSchema);
  });

  it("should convert boolean true to empty object", () => {
    // Empty objects merge to boolean true, should convert back to {}
    const schema = { allOf: [{}] } as JSONSchema7;
    const result = flattenAllOf(schema);
    expect(result).toEqual({});
  });

  it("should convert boolean false to not schema", () => {
    // Boolean false should convert to { not: {} }
    const result = flattenAllOf(false);
    expect(result).toEqual({ not: {} });
  });

  it("should handle empty schema objects in properties", () => {
    // Reproduces issue #1837: _id: {} should not crash
    const schema = {
      type: "object",
      properties: {
        _id: {},
        name: { type: "string" },
      },
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    invariant(typeof result === "object", "Result is not a schema");

    // Empty object should be preserved or converted to valid schema
    expect(result.properties?._id).toBeDefined();
    expect(result.properties?.name).toEqual({ type: "string" });
  });

  it("should preserve description and other properties", () => {
    const schema = {
      description: "A test schema",
      allOf: [
        { type: "object", properties: { id: { type: "string" } } },
        { type: "object", properties: { name: { type: "string" } } },
      ],
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    invariant(typeof result === "object", "Result is not a schema");

    expect(result.description).toBe("A test schema");
    expect(result.properties).toBeDefined();
  });

  it("should merge required arrays", () => {
    const schema = {
      allOf: [
        {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        {
          type: "object",
          properties: { name: { type: "string" } },
          required: ["name"],
        },
      ],
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    invariant(typeof result === "object", "Result is not a schema");

    expect(result.required).toEqual(expect.arrayContaining(["id", "name"]));
  });

  it("should handle complex nested structures", () => {
    const schema = {
      type: "object",
      properties: {
        booking: {
          allOf: [
            {
              allOf: [
                {
                  type: "object",
                  properties: { quoteId: { type: "string" } },
                },
                {
                  type: "object",
                  properties: { price: { type: "number" } },
                },
              ],
            },
            {
              type: "object",
              properties: { bookingId: { type: "string" } },
            },
          ],
        },
      },
    } as JSONSchema7;

    const result = flattenAllOf(schema);

    invariant(
      typeof result === "object" && result.properties,
      "Result is not a schema",
    );

    expect(result.properties.booking).toMatchObject({
      type: "object",
      properties: {
        quoteId: { type: "string" },
        price: { type: "number" },
        bookingId: { type: "string" },
      },
    });
    expect(result.properties.booking).not.toHaveProperty("allOf");
  });
});

describe("flattenAllOf processor", () => {
  it("should process an OpenAPI document and flatten allOf", async () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      allOf: [
                        {
                          type: "object",
                          properties: { id: { type: "string" } },
                        },
                        {
                          type: "object",
                          properties: { name: { type: "string" } },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = await flattenAllOfProcessor({
      schema,
      file: "/test/schema.json",
      dereference: vi.fn(),
    });

    const responseSchema =
      result.paths?.["/users"]?.get?.responses?.[200]?.content?.[
        "application/json"
      ]?.schema;

    expect(responseSchema).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    });
    expect(responseSchema).not.toHaveProperty("allOf");
  });

  it("should process components.schemas and flatten allOf", async () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          User: {
            allOf: [
              { type: "object", properties: { id: { type: "string" } } },
              { type: "object", properties: { name: { type: "string" } } },
            ],
          },
        },
      },
    };

    const mockDereference = vi.fn().mockResolvedValue(schema);

    const result = await flattenAllOfProcessor({
      schema,
      file: "/test/schema.json",
      dereference: mockDereference,
    });

    const userSchema = result.components?.schemas?.User;
    expect(userSchema).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    });
    expect(userSchema).not.toHaveProperty("allOf");
  });

  it("should handle schemas without allOf gracefully", async () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {},
    };

    const result = await flattenAllOfProcessor({
      schema,
      file: "/test/schema.json",
      dereference: vi.fn(),
    });

    expect(result).toStrictEqual(schema);
  });

  it("should only flatten schema objects, not other OpenAPI structures", async () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "getUsers",
            tags: ["users"],
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      allOf: [
                        {
                          type: "object",
                          properties: { id: { type: "string" } },
                        },
                        {
                          type: "object",
                          properties: { name: { type: "string" } },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const mockDereference = vi.fn().mockResolvedValue(schema);

    const result = await flattenAllOfProcessor({
      schema,
      file: "/test/schema.json",
      dereference: mockDereference,
    });

    // Operation objects should not be flattened
    const operation = result.paths?.["/users"]?.get;
    expect(operation?.operationId).toBe("getUsers");
    expect(operation?.tags).toEqual(["users"]);

    // But schema objects should be flattened
    const responseSchema =
      operation?.responses?.[200]?.content?.["application/json"]?.schema;
    expect(responseSchema).not.toHaveProperty("allOf");
  });

  it("should handle deeply nested allOf in request bodies", async () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {
        "/bookings": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      {
                        allOf: [
                          {
                            type: "object",
                            properties: { quoteId: { type: "string" } },
                          },
                          {
                            type: "object",
                            properties: { price: { type: "number" } },
                          },
                        ],
                      },
                      {
                        type: "object",
                        properties: { bookingId: { type: "string" } },
                      },
                    ],
                  },
                },
              },
            },
            responses: {},
          },
        },
      },
    };

    const mockDereference = vi.fn().mockResolvedValue(schema);

    const result = await flattenAllOfProcessor({
      schema,
      file: "/test/schema.json",
      dereference: mockDereference,
    });

    const requestSchema =
      result.paths?.["/bookings"]?.post?.requestBody?.content?.[
        "application/json"
      ]?.schema;

    expect(requestSchema).toMatchObject({
      type: "object",
      properties: {
        quoteId: { type: "string" },
        price: { type: "number" },
        bookingId: { type: "string" },
      },
    });
    expect(requestSchema).not.toHaveProperty("allOf");
  });

  it("should handle mixed allOf and oneOf combinations", async () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          Container: {
            oneOf: [
              {
                allOf: [
                  {
                    type: "object",
                    properties: { type: { type: "string", const: "standard" } },
                  },
                  {
                    type: "object",
                    properties: { weight: { type: "number" } },
                  },
                ],
              },
              {
                allOf: [
                  {
                    type: "object",
                    properties: {
                      type: { type: "string", const: "refrigerated" },
                    },
                  },
                  {
                    type: "object",
                    properties: { temperature: { type: "number" } },
                  },
                ],
              },
            ],
          },
        },
      },
    };

    const mockDereference = vi.fn().mockResolvedValue(schema);

    const result = await flattenAllOfProcessor({
      schema,
      file: "/test/schema.json",
      dereference: mockDereference,
    });

    const containerSchema = result.components?.schemas?.Container;
    expect(containerSchema?.oneOf?.[0]).toMatchObject({
      type: "object",
      properties: {
        type: { type: "string", const: "standard" },
        weight: { type: "number" },
      },
    });
    expect(containerSchema?.oneOf?.[0]).not.toHaveProperty("allOf");
    expect(containerSchema?.oneOf?.[1]).toMatchObject({
      type: "object",
      properties: {
        type: { type: "string", const: "refrigerated" },
        temperature: { type: "number" },
      },
    });
    expect(containerSchema?.oneOf?.[1]).not.toHaveProperty("allOf");
  });

  it("should preserve $refs outside of allOf while flattening allOf with $refs", async () => {
    // Schema with:
    // 1. A reusable component (Base) that's referenced multiple times
    // 2. An allOf that references Base (should be resolved for merging)
    // 3. A property that references Base (should stay as $ref)
    const schema = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          Base: {
            type: "object",
            properties: {
              id: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          Extended: {
            allOf: [
              { $ref: "#/components/schemas/Base" },
              {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
              },
            ],
          },
          Container: {
            type: "object",
            properties: {
              // This $ref should NOT be expanded
              nested: { $ref: "#/components/schemas/Base" },
            },
          },
        },
      },
    } as OpenAPIDocument;

    const result = await flattenAllOfProcessor({
      schema,
      file: "/test/schema.json",
      dereference: vi.fn(),
    });

    // Extended should have allOf flattened (merged with Base)
    const extendedSchema = result.components?.schemas?.Extended;
    expect(extendedSchema).not.toHaveProperty("allOf");
    expect(extendedSchema).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        name: { type: "string" },
      },
    });

    // Container.nested should still be a $ref (NOT expanded)
    const containerSchema = result.components?.schemas
      ?.Container as unknown as Record<string, unknown>;
    const nestedProp = (containerSchema?.properties as Record<string, unknown>)
      ?.nested as Record<string, unknown>;
    expect(nestedProp).toHaveProperty("$ref");
    expect(nestedProp.$ref).toBe("#/components/schemas/Base");
  });
});
