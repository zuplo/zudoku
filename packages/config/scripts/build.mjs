import esbuild from "esbuild";

await esbuild.build({
  entryPoints: [
    new URL("../../zudoku/src/config/loader.ts", import.meta.url).pathname,
  ],
  outdir: "dist",
  bundle: true,
  target: "es2022",
  splitting: true,
  format: "esm",
  platform: "node",
});
