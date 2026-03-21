import { afterEach, describe, expect, it } from "vitest";
import {
  applySecurityCredentials,
  type BasicCredentials,
  getSecurityLockedHeaders,
  type SecurityCredential,
  useSecurityCredentialsStore,
} from "./securityCredentialsStore.js";

// Helper to create a security requirement
const makeReq = (
  schemes: Array<{
    name: string;
    type: string;
    scopes?: string[];
    in?: string;
    paramName?: string;
    scheme?: string;
  }>,
) => ({
  schemes: schemes.map((s) => ({
    scopes: s.scopes ?? [],
    scheme: {
      name: s.name,
      type: s.type as any,
      in: s.in ?? null,
      paramName: s.paramName ?? null,
      scheme: s.scheme ?? null,
    },
  })),
});

const cred = (value: string | BasicCredentials): SecurityCredential => ({
  value,
  isAuthorized: true,
});

describe("useSecurityCredentialsStore", () => {
  afterEach(() => {
    useSecurityCredentialsStore.getState().clearAll();
  });

  it("should start with empty credentials", () => {
    const state = useSecurityCredentialsStore.getState();
    expect(state.credentials).toEqual({});
  });

  it("should set and retrieve a credential", () => {
    const store = useSecurityCredentialsStore.getState();
    store.setCredential("ApiKey", "my-secret-key");

    const updated = useSecurityCredentialsStore.getState();
    expect(updated.credentials.ApiKey).toEqual({
      value: "my-secret-key",
      isAuthorized: true,
    });
  });

  it("should clear a single credential", () => {
    const store = useSecurityCredentialsStore.getState();
    store.setCredential("ApiKey", "key1");
    store.setCredential("Bearer", "token1");
    store.clearCredential("ApiKey");

    const updated = useSecurityCredentialsStore.getState();
    expect(updated.credentials.ApiKey).toBeUndefined();
    expect(updated.credentials.Bearer).toBeDefined();
  });

  it("should clear all credentials", () => {
    const store = useSecurityCredentialsStore.getState();
    store.setCredential("ApiKey", "key1");
    store.setCredential("Bearer", "token1");
    store.clearAll();

    const updated = useSecurityCredentialsStore.getState();
    expect(updated.credentials).toEqual({});
  });

  it("should store basic auth credentials", () => {
    const store = useSecurityCredentialsStore.getState();
    store.setCredential("BasicAuth", { username: "user", password: "pass" });

    const updated = useSecurityCredentialsStore.getState();
    expect(updated.credentials.BasicAuth.value).toEqual({
      username: "user",
      password: "pass",
    });
  });
});

describe("getSecurityLockedHeaders", () => {
  it("should return empty array when no security", () => {
    expect(getSecurityLockedHeaders(null, {})).toEqual([]);
    expect(getSecurityLockedHeaders(undefined, {})).toEqual([]);
    expect(getSecurityLockedHeaders([], {})).toEqual([]);
  });

  it("should return empty when no requirement is satisfied", () => {
    const security = [
      makeReq([
        { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-Key" },
      ]),
    ];
    expect(getSecurityLockedHeaders(security, {})).toEqual([]);
  });

  it("should return header name for apiKey in header", () => {
    const security = [
      makeReq([
        {
          name: "ApiKey",
          type: "apiKey",
          in: "header",
          paramName: "X-API-Key",
        },
      ]),
    ];
    const credentials = { ApiKey: cred("secret") };
    expect(getSecurityLockedHeaders(security, credentials)).toEqual([
      "X-API-Key",
    ]);
  });

  it("should return Authorization for http bearer", () => {
    const security = [
      makeReq([{ name: "Bearer", type: "http", scheme: "bearer" }]),
    ];
    const credentials = { Bearer: cred("token123") };
    expect(getSecurityLockedHeaders(security, credentials)).toEqual([
      "Authorization",
    ]);
  });

  it("should return Authorization for http basic", () => {
    const security = [
      makeReq([{ name: "Basic", type: "http", scheme: "basic" }]),
    ];
    const credentials = { Basic: cred({ username: "u", password: "p" }) };
    expect(getSecurityLockedHeaders(security, credentials)).toEqual([
      "Authorization",
    ]);
  });

  it("should return Authorization for oauth2", () => {
    const security = [makeReq([{ name: "OAuth", type: "oauth2" }])];
    const credentials = { OAuth: cred("access-token") };
    expect(getSecurityLockedHeaders(security, credentials)).toEqual([
      "Authorization",
    ]);
  });

  it("should not return header for apiKey in query", () => {
    const security = [
      makeReq([
        { name: "ApiKey", type: "apiKey", in: "query", paramName: "api_key" },
      ]),
    ];
    const credentials = { ApiKey: cred("secret") };
    expect(getSecurityLockedHeaders(security, credentials)).toEqual([]);
  });

  it("should use first satisfied requirement (OR logic)", () => {
    const security = [
      makeReq([
        { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-Key" },
      ]),
      makeReq([{ name: "Bearer", type: "http", scheme: "bearer" }]),
    ];
    // Only Bearer is authorized
    const credentials = { Bearer: cred("token") };
    expect(getSecurityLockedHeaders(security, credentials)).toEqual([
      "Authorization",
    ]);
  });

  it("should require all schemes for AND logic", () => {
    const security = [
      makeReq([
        { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-Key" },
        { name: "Bearer", type: "http", scheme: "bearer" },
      ]),
    ];
    // Only one is authorized — not enough for AND
    const credentials = { ApiKey: cred("key") };
    expect(getSecurityLockedHeaders(security, credentials)).toEqual([]);
  });

  it("should return all headers for AND when both satisfied", () => {
    const security = [
      makeReq([
        { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-Key" },
        { name: "Bearer", type: "http", scheme: "bearer" },
      ]),
    ];
    const credentials = { ApiKey: cred("key"), Bearer: cred("token") };
    expect(getSecurityLockedHeaders(security, credentials)).toEqual([
      "X-Key",
      "Authorization",
    ]);
  });
});

describe("applySecurityCredentials", () => {
  const makeRequest = (url = "https://api.example.com/test") =>
    new Request(url, { method: "GET" });

  it("should not modify request when no security", () => {
    const request = makeRequest();
    applySecurityCredentials(request, null, {});
    expect(request.headers.get("Authorization")).toBeNull();
  });

  it("should not modify request when no credentials match", () => {
    const security = [
      makeReq([
        { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-Key" },
      ]),
    ];
    const request = makeRequest();
    applySecurityCredentials(request, security, {});
    expect(request.headers.get("X-Key")).toBeNull();
  });

  it("should set apiKey header", () => {
    const security = [
      makeReq([
        {
          name: "ApiKey",
          type: "apiKey",
          in: "header",
          paramName: "X-API-Key",
        },
      ]),
    ];
    const request = makeRequest();
    applySecurityCredentials(request, security, { ApiKey: cred("my-key") });
    expect(request.headers.get("X-API-Key")).toBe("my-key");
  });

  it("should set apiKey cookie", () => {
    const security = [
      makeReq([
        {
          name: "SessionAuth",
          type: "apiKey",
          in: "cookie",
          paramName: "session_id",
        },
      ]),
    ];
    const request = makeRequest();
    applySecurityCredentials(request, security, {
      SessionAuth: cred("abc123"),
    });
    expect(request.headers.get("Cookie")).toBe("session_id=abc123");
  });

  it("should set bearer token", () => {
    const security = [
      makeReq([{ name: "Bearer", type: "http", scheme: "bearer" }]),
    ];
    const request = makeRequest();
    applySecurityCredentials(request, security, { Bearer: cred("jwt-token") });
    expect(request.headers.get("Authorization")).toBe("Bearer jwt-token");
  });

  it("should set basic auth header", () => {
    const security = [
      makeReq([{ name: "Basic", type: "http", scheme: "basic" }]),
    ];
    const request = makeRequest();
    applySecurityCredentials(request, security, {
      Basic: cred({ username: "admin", password: "secret" }),
    });
    expect(request.headers.get("Authorization")).toBe(
      `Basic ${btoa("admin:secret")}`,
    );
  });

  it("should set oauth2 bearer token", () => {
    const security = [makeReq([{ name: "OAuth", type: "oauth2" }])];
    const request = makeRequest();
    applySecurityCredentials(request, security, {
      OAuth: cred("oauth-access-token"),
    });
    expect(request.headers.get("Authorization")).toBe(
      "Bearer oauth-access-token",
    );
  });

  it("should set openIdConnect bearer token", () => {
    const security = [makeReq([{ name: "OIDC", type: "openIdConnect" }])];
    const request = makeRequest();
    applySecurityCredentials(request, security, {
      OIDC: cred("oidc-token"),
    });
    expect(request.headers.get("Authorization")).toBe("Bearer oidc-token");
  });

  it("should apply first satisfied requirement (OR logic)", () => {
    const security = [
      makeReq([
        { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-Key" },
      ]),
      makeReq([{ name: "Bearer", type: "http", scheme: "bearer" }]),
    ];
    const request = makeRequest();
    // Only Bearer is authorized
    applySecurityCredentials(request, security, {
      Bearer: cred("my-token"),
    });
    expect(request.headers.get("X-Key")).toBeNull();
    expect(request.headers.get("Authorization")).toBe("Bearer my-token");
  });

  it("should apply all schemes in a satisfied AND requirement", () => {
    const security = [
      makeReq([
        { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-Key" },
        { name: "Bearer", type: "http", scheme: "bearer" },
      ]),
    ];
    const request = makeRequest();
    applySecurityCredentials(request, security, {
      ApiKey: cred("my-key"),
      Bearer: cred("my-token"),
    });
    expect(request.headers.get("X-Key")).toBe("my-key");
    expect(request.headers.get("Authorization")).toBe("Bearer my-token");
  });

  it("should not apply partially satisfied AND requirement", () => {
    const security = [
      makeReq([
        { name: "ApiKey", type: "apiKey", in: "header", paramName: "X-Key" },
        { name: "Bearer", type: "http", scheme: "bearer" },
      ]),
    ];
    const request = makeRequest();
    // Only one of two schemes is authorized
    applySecurityCredentials(request, security, {
      ApiKey: cred("my-key"),
    });
    expect(request.headers.get("X-Key")).toBeNull();
    expect(request.headers.get("Authorization")).toBeNull();
  });
});
