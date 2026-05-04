import { type Context, Hono } from "hono";
import { createServer, protectChunks } from "#zudoku-ssr-entry";

// Requires `run_worker_first = ["/_protected/*"]` in wrangler.toml. Without
// it, the assets binding serves the chunks directly and skips the gate.

const template = "__TEMPLATE__";
const basePath = "__BASE_PATH__";

type Env = { ASSETS: { fetch: (req: Request) => Promise<Response> } };

const app = new Hono<{ Bindings: Env }>();

const serve = (c: Context<{ Bindings: Env }>) => c.env.ASSETS.fetch(c.req.raw);

app.use(protectChunks({ basePath, serve }));
app.route("/", createServer({ template, basePath }));

export default app;
