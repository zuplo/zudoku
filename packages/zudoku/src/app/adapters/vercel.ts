import path from "node:path";
import { fileURLToPath } from "node:url";
import { serveStatic as defaultServeStatic } from "@hono/node-server/serve-static";
import { handle } from "hono/vercel";
import type { Adapter } from "../adapter.js";
import type { protectChunks } from "../protectChunks.js";

type ProtectChunksOpts = Parameters<typeof protectChunks>[0];
type ServeStaticFactory = Extract<
  ProtectChunksOpts,
  { serveStatic: unknown }
>["serveStatic"];

export type VercelAdapterOptions = {
  serverDir?: string;
  staticDir?: string;
  serveStatic?: ServeStaticFactory;
};

export const vercel = (
  opts: VercelAdapterOptions = {},
): Adapter<ReturnType<typeof handle>> => ({
  setup: (app, ctx) => {
    const serverDir =
      opts.serverDir ?? path.dirname(fileURLToPath(import.meta.url));
    const staticDir = opts.staticDir ?? path.join(serverDir, "..");
    const serveStatic = opts.serveStatic ?? defaultServeStatic;
    app.all("/server/*", (c) => c.notFound());
    app.use(
      ctx.protectChunks({
        basePath: ctx.basePath,
        serverDir,
        serveStatic,
      }),
    );
    app.use("*", serveStatic({ root: staticDir }));
  },
  finalize: (app) => handle(app),
});
