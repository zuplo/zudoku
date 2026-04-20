// @vitest-environment node
import { afterEach, describe, expect, test, vi } from "vitest";
import { createSessionHandler } from "./session-handler.js";

const verifyAccessToken = vi.fn();
const provider = { verifyAccessToken } as unknown as Parameters<
  typeof createSessionHandler
>[0];

const handler = createSessionHandler(provider);
const noProviderHandler = createSessionHandler(undefined);

const sameOriginHeaders = () => ({
  origin: "http://localhost",
  host: "localhost",
  "content-type": "application/json",
});

const post = (body: unknown, extraHeaders: Record<string, string> = {}) =>
  new Request("http://localhost/", {
    method: "POST",
    headers: { ...sameOriginHeaders(), ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const VERIFIED_PROFILE = {
  sub: "u1",
  email: "u@example.com",
  emailVerified: true,
  name: "U",
  pictureUrl: undefined,
};

const verifierResult = (
  expiresAt?: number,
): { profile: typeof VERIFIED_PROFILE; expiresAt?: number } => ({
  profile: VERIFIED_PROFILE,
  expiresAt,
});

const maxAgeOf = (res: Response, cookieName: string): number | undefined => {
  const cookie = res.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${cookieName}=`));
  if (!cookie) return undefined;
  const match = /Max-Age=(\d+)/.exec(cookie);
  return match ? Number(match[1]) : undefined;
};

describe("sessionHandler POST", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("rejects cross-origin requests with 403", async () => {
    const res = await handler.fetch(
      new Request("http://localhost/", {
        method: "POST",
        headers: {
          origin: "http://evil.example",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({ accessToken: "t" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  test("accepts Sec-Fetch-Site same-origin when Origin is missing", async () => {
    verifyAccessToken.mockResolvedValueOnce(verifierResult());
    const res = await handler.fetch(
      new Request("http://localhost/", {
        method: "POST",
        headers: {
          host: "localhost",
          "content-type": "application/json",
          "sec-fetch-site": "same-origin",
        },
        body: JSON.stringify({ accessToken: "t" }),
      }),
    );
    expect(res.status).toBe(200);
  });

  test("rejects Sec-Fetch-Site cross-site with 403", async () => {
    const res = await handler.fetch(
      new Request("http://localhost/", {
        method: "POST",
        headers: {
          host: "localhost",
          "content-type": "application/json",
          "sec-fetch-site": "cross-site",
        },
        body: JSON.stringify({ accessToken: "t" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  test("rejects when neither Origin nor Sec-Fetch-Site is present", async () => {
    const res = await handler.fetch(
      new Request("http://localhost/", {
        method: "POST",
        headers: { host: "localhost", "content-type": "application/json" },
        body: JSON.stringify({ accessToken: "t" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  test("rejects malformed Origin header with 403", async () => {
    const res = await handler.fetch(
      new Request("http://localhost/", {
        method: "POST",
        headers: {
          origin: "://not a url",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({ accessToken: "t" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  test("returns 502 when verifier throws (misconfig / IdP outage)", async () => {
    verifyAccessToken.mockRejectedValueOnce(new Error("jwks fetch failed"));
    const res = await handler.fetch(post({ accessToken: "t" }));
    expect(res.status).toBe(502);
  });

  test("rejects oversized refresh token with 400", async () => {
    const res = await handler.fetch(
      post({ accessToken: "ok", refreshToken: "x".repeat(4001) }),
    );
    expect(res.status).toBe(400);
  });

  test("refresh cookie Max-Age is bounded by verifier refreshExpiresAt", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    verifyAccessToken.mockResolvedValueOnce({
      profile: VERIFIED_PROFILE,
      expiresAt: nowSec + 60,
      refreshExpiresAt: nowSec + 3600,
    });
    const res = await handler.fetch(
      post({ accessToken: "t", refreshToken: "rtok" }),
    );
    expect(res.status).toBe(200);
    const maxAge = maxAgeOf(res, "zudoku-refresh-token");
    expect(maxAge).toBeGreaterThan(0);
    expect(maxAge).toBeLessThanOrEqual(3600);
  });

  test("returns 501 when provider has no verifier", async () => {
    const res = await noProviderHandler.fetch(post({ accessToken: "t" }));
    expect(res.status).toBe(501);
  });

  test("rejects missing access token with 400", async () => {
    const res = await handler.fetch(post({}));
    expect(res.status).toBe(400);
  });

  test("rejects invalid access token with 401", async () => {
    verifyAccessToken.mockResolvedValueOnce(null);
    const res = await handler.fetch(post({ accessToken: "bogus" }));
    expect(res.status).toBe(401);
  });

  test("ignores client-submitted profile and uses verifier result", async () => {
    verifyAccessToken.mockResolvedValueOnce(verifierResult());
    const res = await handler.fetch(
      post({
        accessToken: "valid-token",
        // Attacker tries to forge a privileged profile:
        profile: { sub: "admin", email: "admin@corp.com", role: "admin" },
      }),
    );
    expect(res.status).toBe(200);
    const cookies = res.headers.getSetCookie().join(";");
    expect(cookies).toContain("zudoku-auth-profile=");
    expect(cookies).toContain(encodeURIComponent("u@example.com"));
    expect(cookies).not.toContain(encodeURIComponent("admin@corp.com"));
  });

  test("sets access + refresh token cookies when provided", async () => {
    verifyAccessToken.mockResolvedValueOnce(verifierResult());
    const res = await handler.fetch(
      post({ accessToken: "valid-token", refreshToken: "rtok" }),
    );
    expect(res.status).toBe(200);
    const cookies = res.headers.getSetCookie().join(";");
    expect(cookies).toContain("zudoku-access-token=valid-token");
    expect(cookies).toContain("zudoku-refresh-token=rtok");
  });

  test("session cookie Max-Age is bounded by verifier expiresAt", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    verifyAccessToken.mockResolvedValueOnce(verifierResult(nowSec + 120));
    const res = await handler.fetch(post({ accessToken: "valid-token" }));
    expect(res.status).toBe(200);
    const maxAge = maxAgeOf(res, "zudoku-access-token");
    expect(maxAge).toBeGreaterThan(0);
    expect(maxAge).toBeLessThanOrEqual(120);
  });

  test("refresh cookie Max-Age uses long TTL regardless of access expiry", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    verifyAccessToken.mockResolvedValueOnce(verifierResult(nowSec + 60));
    const res = await handler.fetch(
      post({ accessToken: "valid-token", refreshToken: "rtok" }),
    );
    expect(res.status).toBe(200);
    const maxAge = maxAgeOf(res, "zudoku-refresh-token");
    expect(maxAge).toBeGreaterThan(60 * 60 * 24); // clearly > 1 day
  });

  test("oversized access token is rejected", async () => {
    const res = await handler.fetch(post({ accessToken: "x".repeat(4001) }));
    expect(res.status).toBe(400);
  });
});

describe("sessionHandler DELETE", () => {
  test("clears all auth cookies", async () => {
    const res = await handler.fetch(
      new Request("http://localhost/", { method: "DELETE" }),
    );
    expect(res.status).toBe(200);
    const cookies = res.headers.getSetCookie().join(";");
    expect(cookies).toContain("zudoku-access-token=;");
    expect(cookies).toContain("zudoku-refresh-token=;");
    expect(cookies).toContain("zudoku-auth-profile=;");
  });
});
