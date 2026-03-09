import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type { CookieOptions } from "hono/utils/cookie";
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_PROFILE_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./cookies.js";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "Lax",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  secure: import.meta.env.PROD,
};

const MAX_COOKIE_SIZE = 3900; // Leave margin under 4096 browser limit

const csrfCheck = (c: {
  req: { header: (name: string) => string | undefined };
}): boolean => {
  const origin = c.req.header("Origin");
  const host = c.req.header("Host");

  if (origin && host) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  // When Origin is missing, fall back to Sec-Fetch-Site
  const fetchSite = c.req.header("Sec-Fetch-Site");
  if (fetchSite) {
    return fetchSite === "same-origin" || fetchSite === "same-site";
  }

  // Neither header present — reject by default
  return false;
};

export const sessionHandler = new Hono()
  .post("/", async (c) => {
    if (!csrfCheck(c)) {
      return c.json({ error: "CSRF check failed" }, 403);
    }

    const body = await c.req.json<{
      accessToken?: string;
      refreshToken?: string;
      profile: {
        sub: string;
        email?: string;
        name?: string;
        emailVerified?: boolean;
        pictureUrl?: string;
      };
    }>();

    if (!body.profile) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    setCookie(
      c,
      AUTH_PROFILE_COOKIE,
      JSON.stringify(body.profile),
      cookieOptions,
    );
    if (body.accessToken) {
      if (body.accessToken.length > MAX_COOKIE_SIZE) {
        return c.json({ error: "Access token exceeds cookie size limit" }, 400);
      }
      setCookie(c, ACCESS_TOKEN_COOKIE, body.accessToken, cookieOptions);
    }
    if (body.refreshToken) {
      if (body.refreshToken.length > MAX_COOKIE_SIZE) {
        return c.json(
          { error: "Refresh token exceeds cookie size limit" },
          400,
        );
      }
      setCookie(c, REFRESH_TOKEN_COOKIE, body.refreshToken, cookieOptions);
    }

    return c.json({ ok: true });
  })
  .delete("/", (c) => {
    deleteCookie(c, ACCESS_TOKEN_COOKIE, cookieOptions);
    deleteCookie(c, REFRESH_TOKEN_COOKIE, cookieOptions);
    deleteCookie(c, AUTH_PROFILE_COOKIE, cookieOptions);

    return c.json({ ok: true });
  });
