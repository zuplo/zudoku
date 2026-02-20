import { describe, expect, it } from "vitest";
import type { SchemaObject } from "../../../oas/graphql/index.js";
import { generateSchemaExample } from "./generateSchemaExample.js";

describe("generateSchemaExample", () => {
  it("returns null for undefined schema", () => {
    expect(generateSchemaExample(undefined)).toBeNull();
  });

  it("returns null for circular ref", () => {
    expect(
      generateSchemaExample(
        "$[Circular Reference]:foo" as unknown as SchemaObject,
      ),
    ).toBeNull();
    expect(
      generateSchemaExample(
        "$ref:#/components/schemas/Foo" as unknown as SchemaObject,
      ),
    ).toBeNull();
  });

  describe("example precedence", () => {
    it("returns schema.example directly", () => {
      expect(generateSchemaExample({ example: "hello" })).toBe("hello");
    });

    it("returns examples.default.value (non-schema path upgraded form)", () => {
      expect(
        generateSchemaExample({
          examples: { default: { value: "from-default" } },
        } as unknown as SchemaObject),
      ).toBe("from-default");
    });

    it("returns examples.default directly when not an object with value", () => {
      expect(
        generateSchemaExample({
          examples: { default: "direct" },
        } as unknown as SchemaObject),
      ).toBe("direct");
    });

    it("skips examples.default when it is null", () => {
      expect(
        generateSchemaExample({
          type: "string",
          examples: { default: null },
        } as unknown as SchemaObject),
      ).toBe("string");
    });

    it("returns const over default", () => {
      expect(
        generateSchemaExample({ const: "fixed", default: "fallback" }),
      ).toBe("fixed");
    });

    it("returns default over array examples", () => {
      expect(
        generateSchemaExample({ default: "dflt", examples: ["ignored"] }),
      ).toBe("dflt");
    });

    it("returns const over array examples", () => {
      expect(
        generateSchemaExample({ const: "fixed", examples: ["ignored"] }),
      ).toBe("fixed");
    });

    it("returns first element of array examples", () => {
      expect(generateSchemaExample({ examples: ["first", "second"] })).toBe(
        "first",
      );
    });
  });

  describe("default property", () => {
    it("uses schema.default for string", () => {
      expect(generateSchemaExample({ type: "string", default: "hello" })).toBe(
        "hello",
      );
    });

    it("uses schema.default for number", () => {
      expect(generateSchemaExample({ type: "number", default: 42 })).toBe(42);
    });

    it("uses schema.default for boolean", () => {
      expect(generateSchemaExample({ type: "boolean", default: false })).toBe(
        false,
      );
    });

    it("uses schema.default for object", () => {
      expect(
        generateSchemaExample({
          type: "object",
          default: { key: "value" },
        }),
      ).toEqual({ key: "value" });
    });

    it("uses schema.default for array", () => {
      expect(
        generateSchemaExample({
          type: "array",
          items: { type: "integer" },
          default: [1, 2, 3],
        }),
      ).toEqual([1, 2, 3]);
    });

    it("uses schema.default even when value is falsy (0)", () => {
      expect(generateSchemaExample({ type: "number", default: 0 })).toBe(0);
    });

    it("uses schema.default even when value is empty string", () => {
      expect(generateSchemaExample({ type: "string", default: "" })).toBe("");
    });
  });

  describe("nullable types (array type resolution)", () => {
    it("resolves ['null'] to null", () => {
      expect(generateSchemaExample({ type: ["null"] })).toBeNull();
    });

    it("resolves ['null', 'string'] to string", () => {
      expect(generateSchemaExample({ type: ["null", "string"] })).toBe(
        "string",
      );
    });

    it("resolves ['null', 'string'] with name", () => {
      expect(
        generateSchemaExample({ type: ["null", "string"] }, "username"),
      ).toBe("username");
    });

    it("resolves ['null', 'integer'] to 0", () => {
      expect(generateSchemaExample({ type: ["null", "integer"] })).toBe(0);
    });

    it("resolves ['null', 'object'] with properties", () => {
      expect(
        generateSchemaExample({
          type: ["null", "object"],
          properties: { name: { type: "string" } },
        }),
      ).toEqual({ name: "name" });
    });

    it("resolves nullable string with format", () => {
      expect(
        generateSchemaExample({ type: ["null", "string"], format: "email" }),
      ).toBe("test@example.com");
    });
  });

  describe("object schemas", () => {
    it("generates properties recursively", () => {
      expect(
        generateSchemaExample({
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            active: { type: "boolean" },
          },
        }),
      ).toEqual({ id: 0, name: "name", active: true });
    });

    it("handles nested object with nullable string (#1027)", () => {
      expect(
        generateSchemaExample({
          type: "object",
          properties: {
            address: {
              type: "object",
              properties: {
                city: { type: ["null", "string"] },
                zip: { type: "string" },
              },
            },
          },
        }),
      ).toEqual({ address: { city: "city", zip: "zip" } });
    });

    it("generates sample entry for additionalProperties without properties", () => {
      expect(
        generateSchemaExample({
          type: "object",
          additionalProperties: { type: "string" },
        } as SchemaObject),
      ).toEqual({ key: "string" });
    });

    it("generates sample entry for additionalProperties with object schema", () => {
      expect(
        generateSchemaExample({
          type: "object",
          additionalProperties: {
            type: "object",
            properties: { count: { type: "integer" } },
          },
        } as SchemaObject),
      ).toEqual({ key: { count: 0 } });
    });

    it("prefers properties over additionalProperties", () => {
      expect(
        generateSchemaExample({
          type: "object",
          properties: { id: { type: "integer" } },
          additionalProperties: { type: "string" },
        } as SchemaObject),
      ).toEqual({ id: 0 });
    });
  });

  describe("array schemas", () => {
    it("generates single items schema", () => {
      expect(
        generateSchemaExample({ type: "array", items: { type: "string" } }),
      ).toEqual(["string"]);
    });

    it("generates tuple items", () => {
      expect(
        generateSchemaExample({
          type: "array",
          items: [{ type: "string" }, { type: "integer" }],
        } as SchemaObject),
      ).toEqual(["string", 0]);
    });

    it("returns empty array when no items", () => {
      expect(generateSchemaExample({ type: "array" } as SchemaObject)).toEqual(
        [],
      );
    });
  });

  describe("format handling", () => {
    const cases = [
      ["date-time", "2024-08-25T15:00:00Z"],
      ["date", "2024-08-25"],
      ["time", "15:00:00"],
      ["email", "test@example.com"],
      ["uri", "https://www.example.com/path/to/resource"],
      ["uri-reference", "/path/to/resource"],
      ["uuid", "00000000-0000-0000-0000-000000000000"],
      ["ipv4", "192.168.1.1"],
      ["ipv6", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
      ["hostname", "example.com"],
      ["password", "********"],
      ["byte", "U3dhZ2dlcg=="],
      ["binary", "<binary>"],
      ["duration", "P3D"],
    ] as const;

    for (const [format, expected] of cases) {
      it(`returns example for ${format}`, () => {
        expect(generateSchemaExample({ type: "string", format })).toBe(
          expected,
        );
      });
    }

    it("returns number for int32/int64/float/double formats", () => {
      for (const format of ["int32", "int64", "float", "double"]) {
        expect(generateSchemaExample({ type: "number", format })).toBe(0);
      }
    });

    it("respects minimum for numeric formats", () => {
      expect(
        generateSchemaExample({ type: "integer", format: "int32", minimum: 5 }),
      ).toBe(5);
    });

    it("falls back to type default for unknown format", () => {
      expect(generateSchemaExample({ type: "string", format: "unknown" })).toBe(
        "string",
      );
    });
  });

  describe("number constraints", () => {
    it("respects minimum when 0 is below it", () => {
      expect(generateSchemaExample({ type: "integer", minimum: 1 })).toBe(1);
    });

    it("respects exclusiveMinimum", () => {
      expect(
        generateSchemaExample({ type: "integer", exclusiveMinimum: 0 }),
      ).toBe(1);
    });

    it("respects maximum when 0 is above it", () => {
      expect(generateSchemaExample({ type: "number", maximum: -1 })).toBe(-1);
    });

    it("respects exclusiveMaximum", () => {
      expect(
        generateSchemaExample({ type: "number", exclusiveMaximum: 0 }),
      ).toBe(-1);
    });

    it("returns 0 when it satisfies constraints", () => {
      expect(
        generateSchemaExample({ type: "number", minimum: -10, maximum: 10 }),
      ).toBe(0);
    });

    it("uses minimum when both min and max are positive", () => {
      expect(
        generateSchemaExample({ type: "integer", minimum: 5, maximum: 100 }),
      ).toBe(5);
    });
  });

  describe("string minLength", () => {
    it("pads string when name is shorter than minLength", () => {
      const result = generateSchemaExample(
        { type: "string", minLength: 10 },
        "ab",
      );
      expect(result.length).toBe(10);
      expect(result.startsWith("ab")).toBe(true);
    });

    it("returns name as-is when it meets minLength", () => {
      expect(
        generateSchemaExample({ type: "string", minLength: 3 }, "hello"),
      ).toBe("hello");
    });

    it("pads default 'string' when minLength exceeds it", () => {
      const result = generateSchemaExample({ type: "string", minLength: 10 });
      expect(result.length).toBe(10);
      expect(result.startsWith("string")).toBe(true);
    });
  });

  it("returns first enum value", () => {
    expect(generateSchemaExample({ enum: ["a", "b", "c"] })).toBe("a");
  });

  describe("oneOf", () => {
    it("prefers non-null variant", () => {
      expect(
        generateSchemaExample({
          oneOf: [{ type: "null" }, { type: "string" }],
        }),
      ).toBe("string");
    });

    it("falls back to first when all null", () => {
      expect(generateSchemaExample({ oneOf: [{ type: "null" }] })).toBeNull();
    });
  });

  describe("anyOf", () => {
    it("prefers non-null variant", () => {
      expect(
        generateSchemaExample({
          anyOf: [{ type: "null" }, { type: "integer" }],
        }),
      ).toBe(0);
    });

    it("falls back to first when all null", () => {
      expect(generateSchemaExample({ anyOf: [{ type: "null" }] })).toBeNull();
    });
  });

  describe("primitive defaults", () => {
    it("string returns name when provided", () => {
      expect(generateSchemaExample({ type: "string" }, "field")).toBe("field");
    });

    it("string returns 'string' without name", () => {
      expect(generateSchemaExample({ type: "string" })).toBe("string");
    });

    it("number returns 0", () => {
      expect(generateSchemaExample({ type: "number" })).toBe(0);
    });

    it("integer returns 0", () => {
      expect(generateSchemaExample({ type: "integer" })).toBe(0);
    });

    it("boolean returns true", () => {
      expect(generateSchemaExample({ type: "boolean" })).toBe(true);
    });

    it("null returns null", () => {
      expect(generateSchemaExample({ type: "null" })).toBeNull();
    });

    it("object without properties returns {}", () => {
      expect(generateSchemaExample({ type: "object" })).toEqual({});
    });

    it("unknown type returns {}", () => {
      expect(generateSchemaExample({})).toEqual({});
    });
  });
});
