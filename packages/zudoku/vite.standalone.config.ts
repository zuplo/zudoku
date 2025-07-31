import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { setStandaloneConfig } from "./src/config/loader.js";
import vitePlugin from "./src/vite/plugin.js";

const entries: Record<string, string> = {
  standalone: "./src/app/standalone.tsx",
  demo: "./src/app/demo.tsx",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.ZUDOKU_ENV = "standalone";

setStandaloneConfig(__dirname);

export default defineConfig({
  mode: "standalone",
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    "process.env.ZUPLO_BUILD_CONFIG": "undefined",
  },
  build: {
    sourcemap: true,
    target: "es2022",
    outDir: path.resolve(__dirname, "standalone"),
    lib: {
      entry: Object.entries(entries).reduce((acc, [key, value]) => {
        acc[key] = path.resolve(__dirname, value);
        return acc;
      }, {}),
      name: "Zudoku",
      formats: ["es"],
      fileName: (_format, fileName) => {
        if (fileName === "standalone") {
          return `main.js`;
        } else if (fileName === "demo") {
          return `demo.js`;
        }
        return `zudoku.${fileName}.js`;
      },
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "Module level directives cause errors when bundled" warnings
        if (
          warning.code === "MODULE_LEVEL_DIRECTIVE" ||
          warning.code === "SOURCEMAP_ERROR"
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  plugins: [vitePlugin()],
});
