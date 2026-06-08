import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/cli/cli.ts", "src/vite/prerender/worker.ts"],
  outdir: "dist/cli",
  entryNames: "[name]",
  // Code-splitting so dynamic imports in cli.ts get separate chunks.
  // Chunks must live next to entries (no subdir) because prerender.ts uses
  // `new URL("./worker.js", import.meta.url)` from a chunk to find worker.js.
  chunkNames: "[name]-[hash]",
  splitting: true,
  bundle: true,
  format: "esm",
  packages: "external",
  target: "node20",
  platform: "node",
  logLevel: "error",
});
