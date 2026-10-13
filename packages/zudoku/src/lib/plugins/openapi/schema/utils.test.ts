import { describe, expect, it } from "vitest";
import type { SchemaObject } from "../../../oas/parser/index.js";
import {
  getEnumDescriptions,
  getSchemaRefName,
  isBinarySchema,
  isComplexType,
  unwrapNullableUnion,
  withBinaryMediaType,
} from "./utils.js";

describe("getSchemaRefName", () => {
  it("returns the component name from a components/schemas ref", () => {
    const schema = { type: "object", __$ref: "#/components/schemas/Pet" };
    expect(getSchemaRefName(schema as SchemaObject)).toBe("Pet");
  });

  it("reads __$ref even when defined non-enumerable (build-time codegen)", () => {
    const schema = { type: "object" } as SchemaObject;
    Object.defineProperty(schema, "__$ref", {
      value: "#/components/schemas/Pet",
      enumerable: false,
    });
    expect(getSchemaRefName(schema)).toBe("Pet");
  });

  it("unescapes JSON Pointer tokens per RFC 6901", () => {
    // ~1 → / and ~0 → ~; escaping order matters: ~1 must be substituted first
    const schema = {
      __$ref: "#/components/schemas/application~1json~0v2",
    } as unknown as SchemaObject;
    expect(getSchemaRefName(schema)).toBe("application/json~v2");
  });

  it("URI-decodes percent-encoded characters", () => {
    const schema = {
      __$ref: "#/components/schemas/Foo%20Bar",
    } as unknown as SchemaObject;
    expect(getSchemaRefName(schema)).toBe("Foo Bar");
  });

  it.each([
    ["#/components/parameters/Limit"],
    ["#/components/responses/NotFound"],
    ["other.yaml#/components/schemas/Pet"],
  ])("returns undefined for refs outside components/schemas: %s", (ref) => {
    const schema = { __$ref: ref } as unknown as SchemaObject;
    expect(getSchemaRefName(schema)).toBeUndefined();
  });

  it("returns undefined when __$ref is missing", () => {
    expect(
      getSchemaRefName({ type: "object" } as SchemaObject),
    ).toBeUndefined();
  });

  it("returns undefined for null/undefined schema", () => {
    expect(getSchemaRefName(null)).toBeUndefined();
    expect(getSchemaRefName(undefined)).toBeUndefined();
  });

  it("returns undefined for string schemas (circular refs serialized by handleCircularRefs)", () => {
    // Regression lock: circular refs surface as "$ref:#/..." strings from
    // handleCircularRefs; without the typeof guard, `"__$ref" in schema` throws.
    expect(
      getSchemaRefName(
        "$ref:#/components/schemas/Organization" as unknown as SchemaObject,
      ),
    ).toBeUndefined();
  });
});

describe("isBinarySchema", () => {
  it("detects raw binary described by contentMediaType without type", () => {
    expect(isBinarySchema({ contentMediaType: "image/png" })).toBe(true);
  });

  it("ignores typed and empty schemas", () => {
    expect(
      isBinarySchema({ type: "string", contentMediaType: "application/json" }),
    ).toBe(false);
    expect(isBinarySchema({})).toBe(false);
  });
});

describe("withBinaryMediaType", () => {
  it("marks undescribed schemas of binary media types as binary", () => {
    expect(withBinaryMediaType({}, "audio/mpeg")).toEqual({
      contentMediaType: "audio/mpeg",
    });
    expect(
      withBinaryMediaType(
        { description: "Raw bytes" },
        "application/octet-stream",
      ),
    ).toEqual({
      description: "Raw bytes",
      contentMediaType: "application/octet-stream",
    });
  });

  it("leaves other schemas and media types alone", () => {
    const typed: SchemaObject = { type: "string" };
    const object: SchemaObject = { properties: { id: { type: "string" } } };
    expect(withBinaryMediaType(typed, "image/png")).toBe(typed);
    expect(withBinaryMediaType(object, "image/png")).toBe(object);
    expect(withBinaryMediaType({}, "application/json")).toEqual({});
    expect(withBinaryMediaType(null, "image/png")).toBeUndefined();
  });
});

describe("unwrapNullableUnion", () => {
  const pilot: SchemaObject = {
    type: "object",
    properties: { name: { type: "string" } },
  };

  it("unwraps anyOf with a null variant and keeps sibling keywords", () => {
    expect(
      unwrapNullableUnion({
        anyOf: [pilot, { type: "null" }],
        description: "Optional co-pilot",
      }),
    ).toEqual({
      schema: { ...pilot, description: "Optional co-pilot" },
      nullable: true,
    });
  });

  it("unwraps oneOf with the null variant first", () => {
    expect(
      unwrapNullableUnion({ oneOf: [{ type: "null" }, { type: "string" }] }),
    ).toEqual({ schema: { type: "string" }, nullable: true });
  });

  it("returns circular refs as they are", () => {
    const circular = "$ref:#/components/schemas/LinkedShipment";
    expect(
      unwrapNullableUnion({
        anyOf: [circular as unknown as SchemaObject, { type: "null" }],
      }),
    ).toEqual({ schema: circular, nullable: true });
  });

  it("leaves other unions alone", () => {
    const cases: SchemaObject[] = [
      { anyOf: [{ type: "string" }, { type: "integer" }] },
      { anyOf: [{ type: "string" }, { type: "integer" }, { type: "null" }] },
      { anyOf: [{ type: "null" }, { type: "null" }] },
      { type: "object", anyOf: [pilot, { type: "null" }] },
    ];
    for (const schema of cases) {
      expect(unwrapNullableUnion(schema)).toEqual({ schema, nullable: false });
    }
  });
});

describe("isComplexType", () => {
  it("does not treat arrays of binary items as complex", () => {
    expect(
      isComplexType({
        type: "array",
        items: { contentMediaType: "application/octet-stream" },
      }),
    ).toBe(false);
    expect(isComplexType({ type: "array", items: { type: "object" } })).toBe(
      true,
    );
  });
});

describe("getEnumDescriptions", () => {
  it("zips a string array with enum by position", () => {
    const schema = {
      type: "string",
      enum: ["pending", "in_transit", "delivered"],
      "x-enum-descriptions": ["Awaiting pickup", "", "Arrived", "extra"],
    } as SchemaObject;
    expect(getEnumDescriptions(schema)).toEqual({
      pending: "Awaiting pickup",
      delivered: "Arrived",
    });
  });
});
