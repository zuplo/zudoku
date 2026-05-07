import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serveStatic as defaultServeStatic } from "@hono/node-server/serve-static";
import { handle } from "hono/aws-lambda";
import type { Adapter } from "../adapter.js";
import type { protectChunks } from "../protectChunks.js";

type ProtectChunksOpts = Parameters<typeof protectChunks>[0];
type ServeStaticFactory = Extract<
  ProtectChunksOpts,
  { serveStatic: unknown }
>["serveStatic"];

export type LambdaAdapterOptions = {
  serverDir?: string;
  serveStatic?: ServeStaticFactory;
};

export const lambda = (
  opts: LambdaAdapterOptions = {},
): Adapter<ReturnType<typeof handle>> => ({
  setup: (app, ctx) => {
    const serverDir = opts.serverDir ?? dirname(fileURLToPath(import.meta.url));
    const serveStatic = opts.serveStatic ?? defaultServeStatic;
    app.all("/server/*", (c) => c.notFound());
    app.use(
      ctx.protectChunks({
        basePath: ctx.basePath,
        serverDir,
        serveStatic,
      }),
    );
    app.use("*", serveStatic({ root: dirname(serverDir) }));
  },
  finalize: (app) => handle(app),
});
