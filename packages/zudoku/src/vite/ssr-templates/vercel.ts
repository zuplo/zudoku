import { handle } from "hono/vercel";
// @ts-expect-error - Loading entry.server.js will be bundled
import { createServer } from "./entry.server.js";

// Vercel Edge Functions
// Static files served automatically from dist/client via vercel.json rewrites

const template = "__TEMPLATE__";
const basePath = "__BASE_PATH__";

const app = createServer({ template, basePath });

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);

export const config = { runtime: "edge" };
