// @vitest-environment node
import { afterEach, describe, expect, test, vi } from "vitest";
import clerkAuth from "./clerk.js";

const jwtVerify = vi.fn();
const createRemoteJWKSet = vi.fn((_url: URL) => ({}));

class FakeJOSEError extends Error {}

vi.mock("jose", () => ({
  jwtVerify: (token: string, keys: unknown, opts?: unknown) =>
    jwtVerify(token, keys, opts),
  createRemoteJWKSet: (url: URL) => createRemoteJWKSet(url),
  errors: { JOSEError: FakeJOSEError },
}));

// atob("clerk.example.com$") === "Y2xlcmsuZXhhbXBsZS5jb20k"
const TEST_PUB_KEY = "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k" as const;

const buildProvider = () =>
  clerkAuth({
    type: "clerk",
    clerkPubKey: TEST_PUB_KEY,
    jwtTemplateName: "default",
  });

describe("clerk verifyAccessToken", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("asserts issuer when verifying", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: { sub: "u1", exp: 9999999999 },
    });
    const provider = buildProvider();
    await provider.verifyAccessToken?.("jwt");
    // biome-ignore lint/style/noNonNullAssertion: For testing purposes
    const [, , opts] = jwtVerify.mock.calls[0]!;
    expect(opts).toEqual({ issuer: "https://clerk.example.com" });
  });

  test("returns profile and expiresAt on success", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: {
        sub: "u1",
        email: "u@example.com",
        name: "U",
        email_verified: true,
        picture: "https://example.com/p.png",
        exp: 1_700_000_000,
      },
    });
    const provider = buildProvider();
    const result = await provider.verifyAccessToken?.("jwt");
    expect(result).toEqual({
      profile: {
        sub: "u1",
        email: "u@example.com",
        name: "U",
        emailVerified: true,
        pictureUrl: "https://example.com/p.png",
      },
      expiresAt: 1_700_000_000,
    });
  });

  test("returns undefined for a JOSE error (bad signature / expired)", async () => {
    jwtVerify.mockRejectedValueOnce(new FakeJOSEError("bad signature"));
    const provider = buildProvider();
    const result = await provider.verifyAccessToken?.("jwt");
    expect(result).toBeUndefined();
  });

  test("rethrows non-JOSE errors (e.g. JWKS fetch failure → 502)", async () => {
    jwtVerify.mockRejectedValueOnce(new Error("jwks network error"));
    const provider = buildProvider();
    await expect(provider.verifyAccessToken?.("jwt")).rejects.toThrow(
      "jwks network error",
    );
  });

  test("returns undefined when payload has no sub", async () => {
    jwtVerify.mockResolvedValueOnce({ payload: { exp: 1 } });
    const provider = buildProvider();
    const result = await provider.verifyAccessToken?.("jwt");
    expect(result).toBeUndefined();
  });

  test("JWKS cache is per provider instance, not module-global", async () => {
    jwtVerify.mockResolvedValue({ payload: { sub: "u1" } });

    const a = buildProvider();
    const b = buildProvider();
    await a.verifyAccessToken?.("t");
    await a.verifyAccessToken?.("t");
    await b.verifyAccessToken?.("t");

    // Each instance builds its own JWKS once, so two instances = two calls.
    expect(createRemoteJWKSet).toHaveBeenCalledTimes(2);
  });
});
