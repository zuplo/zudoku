import esbuild from "esbuild";
import { copyFile, writeFile } from "node:fs/promises";
import { createTypeAlias, printNode, zodToTs } from "zod-to-ts";
import { CommonConfigSchema } from "../../zudoku/dist/config/validators/common.js";

/**
 * This file does three things:
 * 1. Build the index.ts file using esbuild - this references the functions
 *    from zudoku we need to bundle in this module
 * 2. Generates the CommonConfig type alias from the zod type in zoduku
 * 3. Copies the manually written index.d.ts file to the dist folder
 */

const result = await esbuild.build({
  entryPoints: [new URL("../src/index.ts", import.meta.url).pathname],
  outdir: "dist",
  bundle: true,
  target: "es2022",
  splitting: true,
  format: "esm",
  platform: "node",
  packages: "external",
  metafile: true,
});

const externals = Object.values(result.metafile?.inputs)
  .map((input) => input.imports)
  .flat()
  .filter((input) => input.external);

await writeFile(
  new URL("../dist/meta.json", import.meta.url).pathname,
  JSON.stringify(externals, null, 2),
);

const { node } = zodToTs(CommonConfigSchema, "User");
const typeAlias = createTypeAlias(node, "CommonConfig");
const nodeString = printNode(typeAlias);

const code = `export ${nodeString}`;

await writeFile(new URL("../dist/config.d.ts", import.meta.url).pathname, code);
await copyFile(
  new URL("../src/index.d.ts", import.meta.url).pathname,
  new URL("../dist/index.d.ts", import.meta.url).pathname,
);
