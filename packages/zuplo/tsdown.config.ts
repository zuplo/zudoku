import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    node: "./src/node.ts",
    "vite-plugin": "./vite-plugin.ts",
  },
  dts: true,
  format: ["esm"],
  external: [/^virtual:/, "@zuplo/zudoku/node"],
});
