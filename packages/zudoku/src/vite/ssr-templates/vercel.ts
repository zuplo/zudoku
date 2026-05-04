import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { createServer, protectChunks } from "#zudoku-ssr-entry";

// Vercel Node serverless runtime; Edge can't read protected chunks from disk.

const template = "__TEMPLATE__";
const basePath = "__BASE_PATH__";

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = join(__dirname, "..");

const app = new Hono();

app.all("/server/*", (c) => c.notFound());
app.use(protectChunks({ basePath, serverDir: __dirname, serveStatic }));
app.use("*", serveStatic({ root: staticDir }));
app.route("/", createServer({ template, basePath }));

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
