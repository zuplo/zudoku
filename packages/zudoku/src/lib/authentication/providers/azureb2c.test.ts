// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import azureB2CAuth from "./azureb2c.js";

const jwtVerify = vi.fn();
const createRemoteJWKSet = vi.fn((_url: URL) => ({}));

class FakeJOSEError extends Error {}

vi.mock("jose", () => ({
  jwtVerify: (token: string, keys: unknown, opts?: unknown) =>
    jwtVerify(token, keys, opts),
  createRemoteJWKSet: (url: URL) => createRemoteJWKSet(url),
  errors: { JOSEError: FakeJOSEError },
}));

// MSAL's constructor kicks off async init work; stub it so the tests don't
// hit the network and we don't need to wait for any of it.
vi.mock("@azure/msal-browser", () => {
  class FakeMsal {
    initialize() {
      return Promise.resolve();
    }
    handleRedirectPromise() {
      return Promise.resolve(null);
    }
    addEventCallback() {
      return undefined;
    }
  }
  return {
    EventType: { LOGIN_SUCCESS: "login_success" },
    PublicClientApplication: FakeMsal,
  };
});

const TENANT = "mytenant";
const POLICY = "B2C_1_signin";
const CLIENT_ID = "client-id";
const ISSUER = `https://${TENANT}.b2clogin.com/tenant-guid/v2.0/`;
const JWKS_URI = `https://${TENANT}.b2clogin.com/${TENANT}.onmicrosoft.com/${POLICY}/discovery/v2.0/keys`;

const discoveryResponse = () =>
  Response.json({ issuer: ISSUER, jwks_uri: JWKS_URI });

const buildProvider = () =>
  azureB2CAuth({
    type: "azureb2c",
    clientId: CLIENT_ID,
    tenantName: TENANT,
    policyName: POLICY,
    issuer: ISSUER,
  });

describe("azureb2c verifyAccessToken", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockResolvedValue(discoveryResponse());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("returns profile + expiresAt from a verified token", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: {
        oid: "oid-1",
        sub: "sub-1",
        emails: ["u@example.com"],
        given_name: "Given",
        family_name: "Family",
        exp: 1_700_000_000,
      },
    });
    const provider = buildProvider();
    const result = await provider.verifyAccessToken?.("jwt");
    expect(result).toEqual({
      profile: {
        sub: "oid-1",
        email: "u@example.com",
        name: "Given Family",
        emailVerified: true,
        pictureUrl: undefined,
      },
      expiresAt: 1_700_000_000,
    });
  });

  test("validates against the discovered issuer", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: { oid: "oid-1" },
    });
    const provider = buildProvider();
    await provider.verifyAccessToken?.("jwt");
    // biome-ignore lint/style/noNonNullAssertion: test setup asserts the call
    const [, , opts] = jwtVerify.mock.calls[0]!;
    expect(opts).toEqual({ issuer: ISSUER });
  });

  test("caches discovery + JWKS per provider instance", async () => {
    jwtVerify.mockResolvedValue({ payload: { oid: "oid-1" } });
    const provider = buildProvider();
    await provider.verifyAccessToken?.("t");
    await provider.verifyAccessToken?.("t");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(createRemoteJWKSet).toHaveBeenCalledTimes(1);
  });

  test("returns undefined for JOSE errors (bad signature / expired)", async () => {
    jwtVerify.mockRejectedValueOnce(new FakeJOSEError("expired"));
    const provider = buildProvider();
    expect(await provider.verifyAccessToken?.("jwt")).toBeUndefined();
  });

  test("rethrows non-JOSE errors (e.g. JWKS fetch) → 502", async () => {
    jwtVerify.mockRejectedValueOnce(new Error("jwks network error"));
    const provider = buildProvider();
    await expect(provider.verifyAccessToken?.("jwt")).rejects.toThrow(
      "jwks network error",
    );
  });

  test("rethrows when discovery endpoint returns non-ok", async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const provider = buildProvider();
    await expect(provider.verifyAccessToken?.("t")).rejects.toThrow(
      /Azure B2C discovery failed/,
    );
  });

  test("returns undefined when no sub/oid claim is present", async () => {
    jwtVerify.mockResolvedValueOnce({ payload: { email: "u@example.com" } });
    const provider = buildProvider();
    expect(await provider.verifyAccessToken?.("jwt")).toBeUndefined();
  });

  test("falls back to given_name + family_name when name claim is missing", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: { oid: "oid-1", given_name: "Ada", family_name: "Lovelace" },
    });
    const provider = buildProvider();
    const result = await provider.verifyAccessToken?.("jwt");
    expect(result?.profile.name).toBe("Ada Lovelace");
  });
});
