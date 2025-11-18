import type { JSONSchema7 } from "json-schema";
import { describe, expect, it, vi } from "vitest";
import type { OpenAPIDocument } from "../oas/parser/index.js";
import { flattenAllOf, flattenAllOfProcessor } from "./flattenAllOf.js";
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

    const mockDereference = vi.fn().mockResolvedValue(schema);

    const result = await flattenAllOfProcessor({
      schema,
      file: "/test/schema.json",
      dereference: mockDereference,
    });

    expect(mockDereference).toHaveBeenCalledWith(schema);

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

  it("should handle errors gracefully and return original schema", async () => {
    const schema: OpenAPIDocument = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {},
    };

    const mockDereference = vi
      .fn()
      .mockRejectedValue(new Error("Dereference failed"));

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await flattenAllOfProcessor({
      schema,
      file: "/test/schema.json",
      dereference: mockDereference,
    });

    expect(result).toBe(schema);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to flatten"),
    );

    consoleSpy.mockRestore();
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
});
