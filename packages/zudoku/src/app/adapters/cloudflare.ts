import type { Context, MiddlewareHandler } from "hono";
import type { Adapter } from "../adapter.js";

// Requires `run_worker_first` for the protected path in wrangler config so
// the gate runs before the ASSETS binding serves the chunk directly.
type AssetsBinding = {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
};

export const cloudflare = <
  Env extends AssetsBinding = AssetsBinding,
>(): Adapter => ({
  setup: (app, ctx) => {
    const serve: MiddlewareHandler = (c) =>
      (c as Context<{ Bindings: Env }>).env.ASSETS.fetch(c.req.raw);
    app.use(ctx.protectChunks({ basePath: ctx.basePath, serve }));
  },
});
