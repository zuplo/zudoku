import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    cli: "src/cli/cli.ts",
    worker: "src/vite/prerender/worker.ts",
  },
  outDir: "dist/cli",
  outExtensions: () => ({ js: ".js" }),
  target: "node20",
  dts: false,
  // Externalize all node_modules deps since they're installed anyway.
  // src/ imports get inlined since path resolution from dist/ to src/ would break.
  external: [/^[^./]/],
});
