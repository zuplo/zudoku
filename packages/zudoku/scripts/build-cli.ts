import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/cli/cli.ts", "src/vite/prerender/worker.ts"],
  outdir: "dist/cli",
  entryNames: "[name]",
  // Enable code-splitting so dynamic imports in cli.ts are chunked
  chunkNames: "chunks/[name]-[hash]",
  splitting: true,
  bundle: true,
  format: "esm",
  packages: "external",
  target: "node20",
  platform: "node",
  logLevel: "error",
});
