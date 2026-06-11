import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "node/index": "./src/node/index.ts",
  },
  dts: true,
  format: ["esm"],
});
