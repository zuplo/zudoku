import { describe, expect, it } from "vitest";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { filterReadOnlyProperties } from "./utils.js";

describe("filterReadOnlyProperties", () => {
  it("should remove readOnly properties from schema", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        id: {
          type: "string",
          readOnly: true,
        },
        name: {
          type: "string",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          readOnly: true,
        },
      },
    };

    const result = filterReadOnlyProperties(schema);

    expect(result.properties).toEqual({
      name: {
        type: "string",
      },
    });
    expect(result.properties).not.toHaveProperty("id");
    expect(result.properties).not.toHaveProperty("createdAt");
  });

  it("should remove readOnly fields from required array", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        id: {
          type: "string",
          readOnly: true,
        },
        name: {
          type: "string",
        },
        email: {
          type: "string",
        },
      },
      required: ["id", "name", "email"],
    };

    const result = filterReadOnlyProperties(schema);

    expect(result.required).toEqual(["name", "email"]);
    expect(result.required).not.toContain("id");
  });

  it("should handle schema without properties", () => {
    const schema: SchemaObject = {
      type: "string",
    };

    const result = filterReadOnlyProperties(schema);

    expect(result).toEqual(schema);
  });

  it("should handle schema with no readOnly properties", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        age: {
          type: "number",
        },
      },
      required: ["name"],
    };

    const result = filterReadOnlyProperties(schema);

    expect(result.properties).toEqual(schema.properties);
    expect(result.required).toEqual(schema.required);
  });

  it("should not modify original schema", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        id: {
          type: "string",
          readOnly: true,
        },
        name: {
          type: "string",
        },
      },
      required: ["id", "name"],
    };

    const original = JSON.parse(JSON.stringify(schema));
    filterReadOnlyProperties(schema);

    expect(schema).toEqual(original);
  });

  it("should handle empty properties object", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {},
    };

    const result = filterReadOnlyProperties(schema);

    expect(result.properties).toEqual({});
  });

  it("should handle all readOnly properties", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        id: {
          type: "string",
          readOnly: true,
        },
        createdAt: {
          type: "string",
          readOnly: true,
        },
      },
      required: ["id"],
    };

    const result = filterReadOnlyProperties(schema);

    expect(result.properties).toEqual({});
    expect(result.required).toBeUndefined();
  });

  it("should preserve other schema properties", () => {
    const schema: SchemaObject = {
      type: "object",
      description: "Test schema",
      properties: {
        id: {
          type: "string",
          readOnly: true,
        },
        name: {
          type: "string",
        },
      },
      additionalProperties: false,
    };

    const result = filterReadOnlyProperties(schema);

    expect(result.description).toBe("Test schema");
    expect(result.additionalProperties).toBe(false);
    expect(result.type).toBe("object");
  });

  it("should handle readOnly: false", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        id: {
          type: "string",
          readOnly: false,
        },
        name: {
          type: "string",
        },
      },
    };

    const result = filterReadOnlyProperties(schema);

    expect(result.properties).toHaveProperty("id");
    expect(result.properties).toHaveProperty("name");
  });

  it("should handle complex nested schemas", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        id: {
          type: "string",
          readOnly: true,
        },
        user: {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
          },
        },
      },
      required: ["id"],
    };

    const result = filterReadOnlyProperties(schema);

    // Should only filter top-level readOnly properties
    expect(result.properties).not.toHaveProperty("id");
    expect(result.properties).toHaveProperty("user");
    expect(result.required).toBeUndefined();
  });
});
