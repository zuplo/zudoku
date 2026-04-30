import type { serveStatic } from "@hono/node-server/serve-static";
import type { MiddlewareHandler } from "hono";
import logger from "loglevel";
import { parseCookies } from "../lib/authentication/cookies.js";
import { joinUrl } from "../lib/util/joinUrl.js";

// Gates /_protected/* chunks behind an auth cookie. Path segment must
// match vite/protected/registry.ts#PROTECTED_CHUNK_DIR. basePath is mixed
// into the prefix so deployments served under a subpath match correctly.
//
// When `verifyAccessToken` is provided the cookie value is verified against
// the auth provider (same check session-handler does at issuance) so a
// forged cookie value cannot bypass the gate. Falsy/throw both fail closed.
export const protectedAssets = (opts: {
  serverDir: string;
  serveStatic: typeof serveStatic;
  basePath?: string;
  verifyAccessToken?: (token: string) => Promise<unknown>;
}): MiddlewareHandler => {
  const prefix = joinUrl(opts.basePath, "/_protected");
  const serve = opts.serveStatic({
    root: `${opts.serverDir}/_protected`,
    rewriteRequestPath: (p) => p.slice(prefix.length) || "/",
  });
  const verify = opts.verifyAccessToken;

  const unauthorized = (c: Parameters<MiddlewareHandler>[0]) =>
    c.text("Unauthorized", 401, {
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
    });

  return async (c, next) => {
    if (!c.req.path.startsWith(`${prefix}/`)) return next();
    const { accessToken } = parseCookies(c.req.raw);
    if (!accessToken) return unauthorized(c);
    if (verify) {
      try {
        if (!(await verify(accessToken))) return unauthorized(c);
      } catch (error) {
        // Upstream verifier failure (JWKS down, misconfig). Fail closed, but
        // log so operators can distinguish this from normal rejections.
        logger.error(
          `protectedAssets: verifyAccessToken threw for ${c.req.path}:`,
          error,
        );
        return unauthorized(c);
      }
    }
    return serve(c, next);
  };
};
