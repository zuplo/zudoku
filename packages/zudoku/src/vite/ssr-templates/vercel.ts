// @ts-nocheck
import { Hono } from "hono";
import { getRoutesByConfig, handleRequest } from "./entry.server.js";
import zudokuConfig from "./zudoku.config.js";

// Vercel Edge Functions
// Static files served automatically from dist/client via vercel.json rewrites

const template = "__TEMPLATE__";
const basePath = "__BASE_PATH__";
const routes = getRoutesByConfig(zudokuConfig.default ?? zudokuConfig);

const app = new Hono();

app.all("*", (c) =>
  handleRequest({ template, request: c.req.raw, routes, basePath }),
);

export const GET = (req: Request) => app.fetch(req);
export const POST = (req: Request) => app.fetch(req);

export const config = { runtime: "edge" };
