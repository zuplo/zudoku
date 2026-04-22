import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
// @ts-expect-error - entry.server.js will be bundled
import { createServer } from "./entry.server.js";

const template = "__TEMPLATE__";
const basePath = "__BASE_PATH__";

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = join(__dirname, "..");

const app = new Hono();

app.all("/server/*", (c) => c.notFound());
app.use("*", serveStatic({ root: staticDir }));
app.route("/", createServer({ template, basePath }));

serve({ fetch: app.fetch, port: Number(process.env.PORT || 3000) }, (info) => {
  // biome-ignore lint/suspicious/noConsole: Log server info
  console.info(`Server is running on ${info.address}:${info.port}`);
});
