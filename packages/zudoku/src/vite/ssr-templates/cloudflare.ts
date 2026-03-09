// @ts-expect-error - entry.server.js will be bundled
import { createServer } from "./entry.server.js";

// Cloudflare Workers with Static Assets feature
// Static files served automatically via wrangler.toml: assets = { directory = "./dist/client" }

const template = "__TEMPLATE__";
const basePath = "__BASE_PATH__";

export default createServer({ template, basePath });
