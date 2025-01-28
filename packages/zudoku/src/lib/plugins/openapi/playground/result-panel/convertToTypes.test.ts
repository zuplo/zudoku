import { describe, expect, it } from "vitest";
import { generateInterface } from "./convertToTypes.js";

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
