import { describe, expect, it } from "vitest";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import { getGraphQLEndpoint } from "./graphqlEndpoint.js";

const makeOperation = (extension: unknown): OperationsFragmentFragment =>
  ({
    extensions: { "x-graphql": extension },
  }) as unknown as OperationsFragmentFragment;

describe("getGraphQLEndpoint", () => {
  it("returns undefined when extension is missing", () => {
    const op = { extensions: {} } as unknown as OperationsFragmentFragment;
    expect(getGraphQLEndpoint(op)).toBeUndefined();
  });

  it("returns empty config for shorthand `true`", () => {
    expect(getGraphQLEndpoint(makeOperation(true))).toEqual({});
  });

  it("returns the config object when endpoint is provided", () => {
    expect(
      getGraphQLEndpoint(
        makeOperation({ endpoint: "https://api.example.com/graphql" }),
      ),
    ).toEqual({ endpoint: "https://api.example.com/graphql" });
  });

  it("returns empty object when config has no endpoint", () => {
    expect(getGraphQLEndpoint(makeOperation({}))).toEqual({});
  });

  it("returns undefined for invalid shapes", () => {
    expect(getGraphQLEndpoint(makeOperation(false))).toBeUndefined();
    expect(
      getGraphQLEndpoint(makeOperation("https://example.com")),
    ).toBeUndefined();
    expect(
      getGraphQLEndpoint(makeOperation({ endpoint: 123 })),
    ).toBeUndefined();
  });
});
