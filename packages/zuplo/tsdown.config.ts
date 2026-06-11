import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    "node/index": "./src/node/index.ts",
    "vite-plugin": "./vite-plugin.ts",
  },
  dts: true,
  format: ["esm"],
  external: [/^virtual:/],
});
