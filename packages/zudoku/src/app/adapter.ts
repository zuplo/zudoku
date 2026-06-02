import type { Hono } from "hono";
import type { ZudokuManifest } from "../lib/manifest.js";
import type { protectChunks } from "./protectChunks.js";

export type AdapterContext = {
  basePath?: string;
  manifest: ZudokuManifest;
  protectChunks: typeof protectChunks;
};

// `setup` mounts static serving and the protected-chunk gate before the SSR catch-all.
// `finalize` wraps the Hono app if the runtime requires it (e.g. Lambda uses `handle(app)`).
export type Adapter<T = Hono> = {
  setup?: (app: Hono, ctx: AdapterContext) => void;
  finalize?: (app: Hono) => T;
};
