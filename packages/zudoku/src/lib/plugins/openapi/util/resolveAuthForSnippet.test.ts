import { describe, expect, it, vi } from "vitest";
import type { ApiIdentity } from "../../../core/ZudokuContext.js";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import {
  NO_IDENTITY,
  SECURITY_SCHEME_PREFIX,
} from "../playground/constants.js";
import type { SecurityCredential } from "../playground/securityCredentialsStore.js";
import { resolveAuthForSnippet } from "./resolveAuthForSnippet.js";

const makeOperation = (
  schemes: Array<{
    name: string;
    type: string;
    in?: string;
    paramName?: string;
    scheme?: string;
  }>,
): OperationsFragmentFragment =>
  ({
    slug: "test-op",
    security:
      schemes.length > 0
        ? [
            {
              schemes: schemes.map((s) => ({
                scopes: [],
                scheme: {
                  name: s.name,
                  type: s.type as any,
                  in: s.in ?? null,
                  paramName: s.paramName ?? null,
                  scheme: s.scheme ?? null,
                },
              })),
            },
          ]
        : null,
  }) as any;

const authorizedCred = (value: string): SecurityCredential => ({
  value,
  isAuthorized: true,
});

const baseArgs = {
  identities: undefined,
  credentials: {} as Record<string, SecurityCredential>,
};

describe("resolveAuthForSnippet", () => {
  it("returns empty when identityId is undefined", async () => {
    const result = await resolveAuthForSnippet({
      ...baseArgs,
      operation: makeOperation([]),
      identityId: undefined,
    });
    expect(result).toEqual({ headers: [], queryString: [] });
  });

  it("returns empty when identityId is NO_IDENTITY", async () => {
    const result = await resolveAuthForSnippet({
      ...baseArgs,
      operation: makeOperation([]),
      identityId: NO_IDENTITY,
    });
    expect(result).toEqual({ headers: [], queryString: [] });
  });

  it("returns empty when scheme credential is not authorized", async () => {
    const operation = makeOperation([
      { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-API-Key" },
    ]);
    const result = await resolveAuthForSnippet({
      operation,
      identityId: `${SECURITY_SCHEME_PREFIX}ApiKey`,
      identities: undefined,
      credentials: { ApiKey: { value: "secret", isAuthorized: false } },
    });
    expect(result).toEqual({ headers: [], queryString: [] });
  });

  it("returns empty when scheme is not in operation security", async () => {
    const operation = makeOperation([
      { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-API-Key" },
    ]);
    const result = await resolveAuthForSnippet({
      operation,
      identityId: `${SECURITY_SCHEME_PREFIX}OtherScheme`,
      identities: undefined,
      credentials: { OtherScheme: authorizedCred("token") },
    });
    expect(result).toEqual({ headers: [], queryString: [] });
  });

  it("resolves apiKey header scheme into headers", async () => {
    const operation = makeOperation([
      { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-API-Key" },
    ]);
    const result = await resolveAuthForSnippet({
      operation,
      identityId: `${SECURITY_SCHEME_PREFIX}ApiKey`,
      identities: undefined,
      credentials: { ApiKey: authorizedCred("my-secret") },
    });
    expect(result.headers).toEqual([{ name: "x-api-key", value: "my-secret" }]);
    expect(result.queryString).toEqual([]);
  });

  it("resolves apiKey query scheme into queryString", async () => {
    const operation = makeOperation([
      { name: "ApiKey", type: "apiKey", in: "query", paramName: "api_key" },
    ]);
    const result = await resolveAuthForSnippet({
      operation,
      identityId: `${SECURITY_SCHEME_PREFIX}ApiKey`,
      identities: undefined,
      credentials: { ApiKey: authorizedCred("q-secret") },
    });
    expect(result.headers).toEqual([]);
    expect(result.queryString).toEqual([
      { name: "api_key", value: "q-secret" },
    ]);
  });

  it("resolves http bearer scheme into Authorization header", async () => {
    const operation = makeOperation([
      { name: "Bearer", type: "http", scheme: "bearer" },
    ]);
    const result = await resolveAuthForSnippet({
      operation,
      identityId: `${SECURITY_SCHEME_PREFIX}Bearer`,
      identities: undefined,
      credentials: { Bearer: authorizedCred("jwt-token") },
    });
    expect(result.headers).toEqual([
      { name: "authorization", value: "Bearer jwt-token" },
    ]);
  });

  it("resolves ApiIdentity headers and URL query params", async () => {
    const identity: ApiIdentity = {
      id: "my-identity",
      label: "My Identity",
      authorizationFields: { headers: ["Authorization"] },
      authorizeRequest: async (request) => {
        request.headers.set("Authorization", "Bearer id-token");
        const url = new URL(request.url);
        url.searchParams.set("tenant", "acme");
        return new Request(url, request);
      },
    };

    const result = await resolveAuthForSnippet({
      operation: makeOperation([]),
      identityId: "my-identity",
      identities: [identity],
      credentials: {},
    });

    expect(result.headers).toContainEqual({
      name: "authorization",
      value: "Bearer id-token",
    });
    expect(result.queryString).toEqual([{ name: "tenant", value: "acme" }]);
  });

  it("returns empty when identity is not in the identities list", async () => {
    const result = await resolveAuthForSnippet({
      operation: makeOperation([]),
      identityId: "missing",
      identities: [],
      credentials: {},
    });
    expect(result).toEqual({ headers: [], queryString: [] });
  });

  it("returns empty and warns when ApiIdentity.authorizeRequest throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const identity: ApiIdentity = {
      id: "broken",
      label: "Broken",
      authorizeRequest: () => {
        throw new Error("boom");
      },
    };
    const result = await resolveAuthForSnippet({
      operation: makeOperation([]),
      identityId: "broken",
      identities: [identity],
      credentials: {},
    });
    expect(result).toEqual({ headers: [], queryString: [] });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("broken"),
      expect.any(Error),
    );
    warn.mockRestore();
  });
});
