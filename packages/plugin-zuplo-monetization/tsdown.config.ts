import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    "pricing-ui": "./src/pricing-ui/index.ts",
  },
  dts: true,
  format: ["esm"],
});
