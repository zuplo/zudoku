import { describe, expect, it } from "vitest";
import { convertToTypes, generateInterface } from "./convertToTypes.js";

describe("convertToTypes", () => {
  it("should use GeneratedType as default type name", () => {
    const result = convertToTypes({ id: 1, name: "test" });
    expect(result.lines[0]).toBe(
      "type GeneratedType = {\n  id: number;\n  name: string;\n};",
    );
  });

  it("should use custom type name when provided", () => {
    const result = convertToTypes({ id: 1, name: "test" }, "ErrorDetails");
    expect(result.lines[0]).toBe(
      "type ErrorDetails = {\n  id: number;\n  name: string;\n};",
    );
  });

  it("should use custom type name for primitive values", () => {
    const result = convertToTypes("hello", "MyString");
    expect(result.lines[0]).toBe("type MyString = string;");
  });

  it("should use custom type name for arrays", () => {
    const result = convertToTypes([1, 2, 3], "NumberList");
    expect(result.lines[0]).toBe("type NumberList = number[];");
  });

  it("should use custom type name for null", () => {
    const result = convertToTypes(null, "NullType");
    expect(result.lines[0]).toBe("type NullType = null;");
  });

  it("should sanitize type names with spaces into PascalCase", () => {
    const result = convertToTypes({ id: 1 }, "Root Schema");
    expect(result.lines[0]).toMatch(/^type RootSchema = /);
  });

  it("should sanitize type names with special characters", () => {
    const result = convertToTypes({ id: 1 }, "my-error_type.v2");
    expect(result.lines[0]).toMatch(/^type MyErrorTypeV2 = /);
  });

  it("should fall back to GeneratedType for names starting with digits", () => {
    const result = convertToTypes({ id: 1 }, "123invalid");
    expect(result.lines[0]).toMatch(/^type GeneratedType = /);
  });

  it("should fall back to GeneratedType for empty string", () => {
    const result = convertToTypes({ id: 1 }, "");
    expect(result.lines[0]).toMatch(/^type GeneratedType = /);
  });

  it("should fall back to GeneratedType for all-special-chars name", () => {
    const result = convertToTypes({ id: 1 }, "---");
    expect(result.lines[0]).toMatch(/^type GeneratedType = /);
  });
});

describe("generateInterface", () => {
  it("should handle primitive types", () => {
    const input = {
      string: "hello",
      number: 42,
      boolean: true,
      null: null,
    };

    const expected = [
      "{",
      "  string: string;",
      "  number: number;",
      "  boolean: boolean;",
      "  null: null;",
      "}",
    ].join("\n");

    expect(generateInterface(input)).toBe(expected);
  });

  it("should handle nested objects", () => {
    const input = {
      user: {
        name: "John",
        age: 30,
      },
    };

    const expected = [
      "{",
      "  user: {",
      "  name: string;",
      "  age: number;",
      "};",
      "}",
    ].join("\n");

    expect(generateInterface(input)).toBe(expected);
  });

  it("should handle arrays", () => {
    const input = {
      numbers: [1, 2, 3],
      empty: [],
      objects: [{ id: 1 }],
    };

    const expected = [
      "{",
      "  numbers: number[];",
      "  empty: any[];",
      "  objects: {",
      "  id: number;",
      "}[];",
      "}",
    ].join("\n");

    expect(generateInterface(input)).toBe(expected);
  });
});
