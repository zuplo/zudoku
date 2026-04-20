import { describe, expect, it } from "vitest";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { getSchemaRefName } from "./utils.js";

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
