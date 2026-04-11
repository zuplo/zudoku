import { describe, expect, it } from "vitest";
import { getSchemaExample, resolveParamValue } from "./resolveParamValue.js";

describe("getSchemaExample", () => {
  it("returns undefined for null/undefined schema", () => {
    expect(getSchemaExample(null)).toBeUndefined();
    expect(getSchemaExample(undefined)).toBeUndefined();
  });

  it("returns schema.example when present", () => {
    expect(getSchemaExample({ example: "foo" })).toBe("foo");
  });

  it("returns first element of schema.examples array", () => {
    expect(getSchemaExample({ examples: ["a", "b"] })).toBe("a");
  });

  it("prefers schema.example over schema.examples", () => {
    expect(getSchemaExample({ example: "ex", examples: ["arr"] })).toBe("ex");
  });

  it("returns undefined when schema has no example or examples", () => {
    expect(getSchemaExample({ type: "string" })).toBeUndefined();
  });

  it("handles falsy example values correctly", () => {
    expect(getSchemaExample({ example: 0 })).toBe(0);
    expect(getSchemaExample({ example: "" })).toBe("");
    expect(getSchemaExample({ example: false })).toBe(false);
  });

  it("ignores non-array examples", () => {
    expect(
      getSchemaExample({ examples: { default: { value: "x" } } }),
    ).toBeUndefined();
  });
});

describe("resolveParamValue", () => {
  const param = (overrides: {
    schemaDefault?: unknown;
    schemaExample?: unknown;
    schemaExamples?: unknown[];
    paramExamples?: Array<{ name: string; value?: unknown }>;
  }) => ({
    schema: {
      ...(overrides.schemaDefault !== undefined && {
        default: overrides.schemaDefault,
      }),
      ...(overrides.schemaExample !== undefined && {
        example: overrides.schemaExample,
      }),
      ...(overrides.schemaExamples !== undefined && {
        examples: overrides.schemaExamples,
      }),
    },
    examples: overrides.paramExamples ?? null,
  });

  describe('mode = "none"', () => {
    it("always returns undefined", () => {
      expect(
        resolveParamValue(
          param({ schemaDefault: "d", schemaExample: "e" }),
          "none",
        ),
      ).toBeUndefined();
    });
  });

  describe('mode = "example"', () => {
    it("returns schema.example when available", () => {
      expect(
        resolveParamValue(
          param({ schemaExample: "ex", schemaDefault: "def" }),
          "example",
        ),
      ).toBe("ex");
    });

    it("falls back to parameter-level example", () => {
      expect(
        resolveParamValue(
          param({
            schemaDefault: "def",
            paramExamples: [{ name: "e1", value: "pex" }],
          }),
          "example",
        ),
      ).toBe("pex");
    });

    it("falls back to schema.default when no examples exist", () => {
      expect(
        resolveParamValue(param({ schemaDefault: "def" }), "example"),
      ).toBe("def");
    });

    it("returns schema.examples[0] from OAS 3.1 array", () => {
      expect(
        resolveParamValue(
          param({ schemaExamples: ["arr1", "arr2"], schemaDefault: "def" }),
          "example",
        ),
      ).toBe("arr1");
    });

    it("returns undefined when nothing is set", () => {
      expect(resolveParamValue(param({}), "example")).toBeUndefined();
    });
  });

  describe('mode = "default"', () => {
    it("returns schema.default when available", () => {
      expect(
        resolveParamValue(
          param({ schemaDefault: "def", schemaExample: "ex" }),
          "default",
        ),
      ).toBe("def");
    });

    it("does not fall back to parameter-level examples", () => {
      expect(
        resolveParamValue(
          param({ paramExamples: [{ name: "e1", value: "pex" }] }),
          "default",
        ),
      ).toBeUndefined();
    });

    it("does not fall back to schema.example", () => {
      expect(
        resolveParamValue(param({ schemaExample: "ex" }), "default"),
      ).toBeUndefined();
    });

    it("returns undefined when nothing is set", () => {
      expect(resolveParamValue(param({}), "default")).toBeUndefined();
    });
  });

  describe('mode = "all"', () => {
    it("returns schema.default when available", () => {
      expect(
        resolveParamValue(
          param({ schemaDefault: "def", schemaExample: "ex" }),
          "all",
        ),
      ).toBe("def");
    });

    it("falls back to parameter-level example", () => {
      expect(
        resolveParamValue(
          param({
            schemaExample: "ex",
            paramExamples: [{ name: "e1", value: "pex" }],
          }),
          "all",
        ),
      ).toBe("pex");
    });

    it("falls back to schema.example when no default or param examples", () => {
      expect(resolveParamValue(param({ schemaExample: "ex" }), "all")).toBe(
        "ex",
      );
    });

    it("returns undefined when nothing is set", () => {
      expect(resolveParamValue(param({}), "all")).toBeUndefined();
    });
  });
});
