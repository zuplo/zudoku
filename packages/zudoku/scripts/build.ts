import { build, type BuildOptions } from "esbuild";

const shared: BuildOptions = {
  bundle: true,
  format: "esm",
  packages: "external",
  target: "node20",
  platform: "node",
  logLevel: "error",
};

await Promise.all([
  build({
    ...shared,
    entryPoints: ["src/cli/cli.ts", "src/vite/prerender/worker.ts"],
    outdir: "dist/cli",
    entryNames: "[name]",
  }),
  // Build-time API for external plugins: must be JS (imported from Node), not raw .ts.
  build({
    ...shared,
    entryPoints: ["src/vite/index.ts"],
    outfile: "dist/vite/index.js",
  }),
  // Build-only plugin hooks are loaded natively after Vite's config runner is
  // closed, keeping their heavy extractors out of the client configuration.
  build({
    ...shared,
    entryPoints: ["src/lib/plugins/agentic/build.ts"],
    outfile: "dist/plugins/agentic-build.js",
  }),
]);
