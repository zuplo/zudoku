import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serveStatic as defaultServeStatic } from "@hono/node-server/serve-static";
import type { Adapter } from "../adapter.js";
import type { protectChunks } from "../protectChunks.js";

type ProtectChunksOpts = Parameters<typeof protectChunks>[0];
type ServeStaticFactory = Extract<
  ProtectChunksOpts,
  { serveStatic: unknown }
>["serveStatic"];

export type NodeAdapterOptions = {
  serverDir?: string;
  serveStatic?: ServeStaticFactory;
};

export const node = (opts: NodeAdapterOptions = {}): Adapter => ({
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
});
