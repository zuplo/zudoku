import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type { CookieOptions } from "hono/utils/cookie";
import type { VerifyAccessTokenResult } from "./authentication.js";
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_PROFILE_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./cookies.js";

export type VerifyAccessToken = (
  token: string,
) => Promise<VerifyAccessTokenResult>;

const baseCookieOptions: Omit<CookieOptions, "maxAge"> = {
  httpOnly: true,
  path: "/",
  sameSite: "Lax",
  secure: import.meta.env.PROD,
};

const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const DEFAULT_SESSION_MAX_AGE = 60 * 60; // 1 hour fallback when verifier omits expiresAt

const cookieMaxAge = (
  expiresAt: number | undefined,
  fallback: number,
): number => {
  if (typeof expiresAt !== "number") return fallback;
  const remaining = Math.floor(expiresAt - Date.now() / 1000);
  return remaining > 0 ? Math.min(remaining, fallback) : fallback;
};

const MAX_COOKIE_SIZE = 3900; // Leave margin under 4096 browser limit
const MAX_BODY_SIZE = 64 * 1024;

const sameOriginCheck = (c: {
  req: { header: (name: string) => string | undefined };
}): boolean => {
  // Sec-Fetch-Site is set by the browser and cannot be forged from JS, so
  // prefer it. The Origin/Host comparison breaks behind any proxy/CDN that
  // rewrites the Host header (CloudFront, etc.).
  const fetchSite = c.req.header("Sec-Fetch-Site");
  if (fetchSite) {
    return fetchSite === "same-origin";
  }

  const origin = c.req.header("Origin");
  const host = c.req.header("Host");
  if (origin && host) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  return false;
};

/**
 * Build the Hono sub-app that manages SSR auth cookies.
 *
 * Profile is derived solely from `verify(token)`; a client-submitted profile
 * is ignored. Callers must send only `{ accessToken, refreshToken? }`.
 * `verify` is omitted when no provider supports SSR auth (→ 501).
 */
export const createSessionHandler = (verify: VerifyAccessToken | undefined) =>
  new Hono()
    .post("/", async (c) => {
      if (!sameOriginCheck(c)) {
        return c.json({ error: "CSRF check failed" }, 403);
      }

      if (!verify) {
        return c.json(
          { error: "SSR authentication is not supported for this provider" },
          501,
        );
      }

      const contentLength = Number(c.req.header("Content-Length") ?? 0);
      if (contentLength > MAX_BODY_SIZE) {
        return c.json({ error: "Request body too large" }, 413);
      }
      const raw = await c.req.text().catch(() => "");
      if (raw.length > MAX_BODY_SIZE) {
        return c.json({ error: "Request body too large" }, 413);
      }
      let body: { accessToken?: unknown; refreshToken?: unknown } | undefined;
      try {
        body = raw ? JSON.parse(raw) : undefined;
      } catch {
        body = undefined;
      }

      const accessToken =
        typeof body?.accessToken === "string" ? body.accessToken : undefined;
      if (!accessToken) {
        return c.json({ error: "Missing access token" }, 400);
      }
      if (accessToken.length > MAX_COOKIE_SIZE) {
        return c.json({ error: "Access token exceeds cookie size limit" }, 400);
      }

      const refreshToken =
        typeof body?.refreshToken === "string" ? body.refreshToken : undefined;
      if (refreshToken && refreshToken.length > MAX_COOKIE_SIZE) {
        return c.json(
          { error: "Refresh token exceeds cookie size limit" },
          400,
        );
      }

      let verified: VerifyAccessTokenResult;
      try {
        verified = await verify(accessToken);
      } catch (e) {
        // biome-ignore lint/suspicious/noConsole: Surface verifier failures
        console.error("SSR auth verifier error:", e);
        return c.json({ error: "Verifier error" }, 502);
      }
      if (!verified) {
        return c.json({ error: "Invalid access token" }, 401);
      }

      const sessionOptions: CookieOptions = {
        ...baseCookieOptions,
        maxAge: cookieMaxAge(verified.expiresAt, DEFAULT_SESSION_MAX_AGE),
      };
      const refreshOptions: CookieOptions = {
        ...baseCookieOptions,
        maxAge: cookieMaxAge(verified.refreshExpiresAt, REFRESH_TOKEN_MAX_AGE),
      };

      let profileJson: string;
      try {
        profileJson = JSON.stringify(verified.profile);
      } catch {
        return c.json({ error: "Profile is not serializable" }, 500);
      }
      if (profileJson.length > MAX_COOKIE_SIZE) {
        return c.json({ error: "Profile exceeds cookie size limit" }, 413);
      }

      setCookie(c, AUTH_PROFILE_COOKIE, profileJson, sessionOptions);
      setCookie(c, ACCESS_TOKEN_COOKIE, accessToken, sessionOptions);
      if (refreshToken) {
        setCookie(c, REFRESH_TOKEN_COOKIE, refreshToken, refreshOptions);
      }

      return c.json({ ok: true });
    })
    .delete("/", (c) => {
      if (!sameOriginCheck(c)) {
        return c.json({ error: "CSRF check failed" }, 403);
      }

      deleteCookie(c, ACCESS_TOKEN_COOKIE, baseCookieOptions);
      deleteCookie(c, REFRESH_TOKEN_COOKIE, baseCookieOptions);
      deleteCookie(c, AUTH_PROFILE_COOKIE, baseCookieOptions);

      return c.json({ ok: true });
    });
