import { describe, expect, it } from "vitest";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import { extractOperationSecuritySchemes } from "./extractOperationSecuritySchemes.js";

const scheme = (name: string) =>
  ({
    scopes: [],
    scheme: {
      name,
      type: "apiKey",
      in: "header",
      paramName: `x-${name}`,
      scheme: null,
    },
  }) as any;

const makeOperation = (
  security: OperationsFragmentFragment["security"],
): OperationsFragmentFragment => ({ security }) as any;

describe("extractOperationSecuritySchemes", () => {
  it("returns empty array when security is null", () => {
    expect(extractOperationSecuritySchemes(makeOperation(null))).toEqual([]);
  });

  it("returns empty array when security is undefined", () => {
    expect(
      extractOperationSecuritySchemes(makeOperation(undefined as never)),
    ).toEqual([]);
  });

  it("returns empty array when security array is empty", () => {
    expect(extractOperationSecuritySchemes(makeOperation([]))).toEqual([]);
  });

  it("returns schemes from a single requirement", () => {
    const result = extractOperationSecuritySchemes(
      makeOperation([{ schemes: [scheme("A"), scheme("B")] }]),
    );
    expect(result.map((s) => s.name)).toEqual(["A", "B"]);
  });

  it("dedupes schemes with the same name across multiple requirements", () => {
    const result = extractOperationSecuritySchemes(
      makeOperation([
        { schemes: [scheme("A"), scheme("B")] },
        { schemes: [scheme("B"), scheme("C")] },
      ]),
    );
    expect(result.map((s) => s.name)).toEqual(["A", "B", "C"]);
  });

  it("preserves first-seen order for duplicates", () => {
    const result = extractOperationSecuritySchemes(
      makeOperation([
        { schemes: [scheme("Z")] },
        { schemes: [scheme("A"), scheme("Z")] },
      ]),
    );
    expect(result.map((s) => s.name)).toEqual(["Z", "A"]);
  });
});
