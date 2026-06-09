import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.tsx",
    "vite-plugin": "./vite-plugin.ts",
  },
  dts: true,
  format: ["esm"],
  external: [/^virtual:/],
});
