import { describe, expect, it } from "vitest";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import { extractOperationSecurityOptions } from "./extractOperationSecurityOptions.js";

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

const optionNames = (operation: OperationsFragmentFragment) =>
  extractOperationSecurityOptions(operation).map((option) => option.names);

describe("extractOperationSecurityOptions", () => {
  it("returns empty array when security is null", () => {
    expect(extractOperationSecurityOptions(makeOperation(null))).toEqual([]);
  });

  it("returns empty array when security is undefined", () => {
    expect(
      extractOperationSecurityOptions(makeOperation(undefined as never)),
    ).toEqual([]);
  });

  it("returns empty array when security array is empty", () => {
    expect(extractOperationSecurityOptions(makeOperation([]))).toEqual([]);
  });

  it("groups the schemes of one requirement into a single option", () => {
    const [option] = extractOperationSecurityOptions(
      makeOperation([{ schemes: [scheme("A"), scheme("B")] }]),
    );
    expect(option?.names).toEqual(["A", "B"]);
    expect(option?.schemes.map((s) => s.paramName)).toEqual(["x-A", "x-B"]);
  });

  it("returns one option per requirement", () => {
    expect(
      optionNames(
        makeOperation([
          { schemes: [scheme("A"), scheme("B")] },
          { schemes: [scheme("C")] },
        ]),
      ),
    ).toEqual([["A", "B"], ["C"]]);
  });

  it("keeps a scheme separate when it is not grouped in a requirement", () => {
    expect(
      optionNames(
        makeOperation([
          { schemes: [scheme("A"), scheme("B")] },
          { schemes: [scheme("A")] },
        ]),
      ),
    ).toEqual([["A", "B"], ["A"]]);
  });

  it("dedupes requirements with the same schemes in any order", () => {
    expect(
      optionNames(
        makeOperation([
          { schemes: [scheme("A"), scheme("B")] },
          { schemes: [scheme("B"), scheme("A")] },
        ]),
      ),
    ).toEqual([["A", "B"]]);
  });

  it("skips empty requirements", () => {
    expect(
      optionNames(makeOperation([{ schemes: [] }, { schemes: [scheme("A")] }])),
    ).toEqual([["A"]]);
  });
});
