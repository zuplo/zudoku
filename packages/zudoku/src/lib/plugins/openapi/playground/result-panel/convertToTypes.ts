type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

function inferType(value: JsonValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "any[]";
    const firstValue = value[0];
    if (firstValue === undefined) return "any[]";
    const elementType = inferType(firstValue);
    return `${elementType}[]`;
  }
  if (typeof value === "object") {
    return generateInterface(value);
  }
  return typeof value;
}

function generateInterface(obj: JsonObject, indentation = ""): string {
  const lines: string[] = ["{"];

  for (const [key, value] of Object.entries(obj)) {
    const propertyType = inferType(value);
    lines.push(`  ${key}: ${propertyType};`);
  }

  lines.push("}");
  return lines.join("\n");
}

export function convertToTypes(json: JsonValue): { lines: string[] } {
  const typeDefinition = inferType(json);
  const lines = [`type GeneratedType = ${typeDefinition};`];
  return { lines };
}

// Tests
import { describe, expect, it } from "vitest";

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
