// @ts-nocheck
import { Hono } from "hono";
import { getRoutesByConfig, handleRequest } from "./entry.server.js";
import config from "./zudoku.config.js";

// Cloudflare Workers with Static Assets feature
// Static files served automatically via wrangler.toml: assets = { directory = "./dist/client" }

const template = "__TEMPLATE__";
const basePath = "__BASE_PATH__";
const routes = getRoutesByConfig(config.default ?? config);

const app = new Hono();

app.all("*", (c) =>
  handleRequest({ template, request: c.req.raw, routes, basePath }),
);

export default app;
