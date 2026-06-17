import { describe, expect, it } from "vitest";
import { joinUrl } from "zudoku";
import {
  isSchemaUrl,
  resolveEndpointUrl,
  resolveSchemaSource,
} from "./interfaces.js";

const GATEWAY = "https://gw.example.com";

describe("isSchemaUrl", () => {
  it("treats http(s) values as URLs", () => {
    expect(isSchemaUrl("https://api.example.com/graphql")).toBe(true);
    expect(isSchemaUrl("http://api.example.com/graphql")).toBe(true);
  });

  it("treats file paths as non-URLs", () => {
    expect(isSchemaUrl("./schema.graphql")).toBe(false);
    expect(isSchemaUrl("graphql")).toBe(false);
    expect(isSchemaUrl("/v1/graphql")).toBe(false);
  });
});

describe("resolveEndpointUrl", () => {
  it("returns undefined when no endpoint is configured", () => {
    expect(resolveEndpointUrl(undefined, GATEWAY)).toBeUndefined();
    expect(resolveEndpointUrl(undefined, undefined)).toBeUndefined();
  });

  it("keeps an absolute URL as-is, ignoring the base", () => {
    const url = "https://api.example.com/graphql";
    expect(resolveEndpointUrl(url, GATEWAY)).toBe(url);
    expect(resolveEndpointUrl(url, undefined)).toBe(url);
  });

  it("prepends the base URL to a relative path", () => {
    expect(resolveEndpointUrl("my-api", GATEWAY)).toBe(`${GATEWAY}/my-api`);
    expect(resolveEndpointUrl("/my-api", GATEWAY)).toBe(`${GATEWAY}/my-api`);
    expect(resolveEndpointUrl("my-api/graphql", GATEWAY)).toBe(
      `${GATEWAY}/my-api/graphql`,
    );
  });

  it("leaves a relative path untouched when no base URL is defined", () => {
    expect(resolveEndpointUrl("/my-api", undefined)).toBe("/my-api");
  });
});

describe("resolveSchemaSource", () => {
  it("uses the configured schema (file path or URL)", () => {
    expect(resolveSchemaSource({ path: "g", schema: "./schema.graphql" })).toBe(
      "./schema.graphql",
    );
    expect(
      resolveSchemaSource({ path: "g", schema: "https://api.example.com/gql" }),
    ).toBe("https://api.example.com/gql");
  });

  it("falls back to the endpoint when it's a URL", () => {
    expect(
      resolveSchemaSource({
        path: "g",
        endpoint: "https://api.example.com/gql",
      }),
    ).toBe("https://api.example.com/gql");
  });

  it("prefers the schema over the endpoint", () => {
    expect(
      resolveSchemaSource({
        path: "g",
        schema: "./schema.graphql",
        endpoint: "https://api.example.com/gql",
      }),
    ).toBe("./schema.graphql");
  });

  it("returns undefined when nothing resolves to a schema source", () => {
    expect(resolveSchemaSource({ path: "g" })).toBeUndefined();
    expect(
      resolveSchemaSource({ path: "g", endpoint: "/relative" }),
    ).toBeUndefined();
  });
});

// Mirrors the workbench: a relative/absolute endpoint resolves first, then an
// unset endpoint defaults to `${gatewayUrl}/graphql` for Zuplo projects.
describe("playground endpoint default", () => {
  const resolve = (
    endpoint: string | undefined,
    gatewayUrl: string | undefined,
  ) =>
    resolveEndpointUrl(endpoint, gatewayUrl) ??
    (gatewayUrl ? joinUrl(gatewayUrl, "graphql") : undefined);

  it("defaults to ${gateway}/graphql when nothing is configured", () => {
    expect(resolve(undefined, GATEWAY)).toBe(`${GATEWAY}/graphql`);
  });

  it("is undefined without a gateway URL or endpoint", () => {
    expect(resolve(undefined, undefined)).toBeUndefined();
  });

  it("does not append /graphql to a configured endpoint", () => {
    expect(resolve("https://api.example.com/v2", GATEWAY)).toBe(
      "https://api.example.com/v2",
    );
    expect(resolve("custom", GATEWAY)).toBe(`${GATEWAY}/custom`);
  });
});
