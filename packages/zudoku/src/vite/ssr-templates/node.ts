// @ts-nocheck
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { getRoutesByConfig, handleRequest } from "./entry.server.js";
import config from "./zudoku.config.js";

const template = "__TEMPLATE__";
const basePath = "__BASE_PATH__";
const routes = getRoutesByConfig(config.default ?? config);

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = join(__dirname, "..");

const app = new Hono();

app.use("*", serveStatic({ root: staticDir }));
app.get("*", (c) =>
  handleRequest({ template, request: c.req.raw, routes, basePath }),
);

serve({ fetch: app.fetch, port: Number(process.env.PORT || 3000) });
