import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.tsx",
  },
  dts: true,
  format: ["esm"],
});
