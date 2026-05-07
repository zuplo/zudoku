import type { Context, MiddlewareHandler } from "hono";
import logger from "loglevel";
import { parseCookies } from "../lib/authentication/cookies.js";
import { PROTECTED_CHUNK_DIR } from "../lib/manifest.js";
import { joinUrl } from "../lib/util/joinUrl.js";

// Shape of @hono/node-server's serveStatic used by filesystem adapters.
// Typed structurally so app/ doesn't import the node-server package.
type ServeStaticFactory = (opts: {
  root: string;
  rewriteRequestPath?: (p: string) => string;
}) => MiddlewareHandler;

type FilesystemServe = { serverDir: string; serveStatic: ServeStaticFactory };
type CustomServe = { serve: MiddlewareHandler };

// Adapter-agnostic guard for /_protected/* chunks. Handles both filesystem ({ serverDir, serveStatic }) and custom serve ({ serve }) options.
// If verifyAccessToken is provided, re-validates the access token cookie. Any falsy or thrown result denies access.
export const protectChunks = (
  opts: {
    basePath?: string;
    verifyAccessToken?: (token: string) => Promise<unknown>;
  } & (FilesystemServe | CustomServe),
): MiddlewareHandler => {
  const prefix = joinUrl(opts.basePath, PROTECTED_CHUNK_DIR);

  const serve: MiddlewareHandler =
    "serve" in opts
      ? opts.serve
      : opts.serveStatic({
          root: `${opts.serverDir}/${PROTECTED_CHUNK_DIR}`,
          rewriteRequestPath: (p) => p.slice(prefix.length) || "/",
        });

  const sendUnauthorized = (c: Context) =>
    c.text("Unauthorized", 401, {
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
    });

  return async (c, next) => {
    if (!c.req.path.startsWith(`${prefix}/`)) return next();

    const { accessToken } = parseCookies(c.req.raw);
    if (!accessToken) return sendUnauthorized(c);

    if (opts.verifyAccessToken) {
      try {
        const verified = await opts.verifyAccessToken(accessToken);
        if (!verified) return sendUnauthorized(c);
      } catch (error) {
        logger.error(
          `protectChunks: verifyAccessToken threw for ${c.req.path}:`,
          error,
        );
        return sendUnauthorized(c);
      }
    }

    return serve(c, next);
  };
};
