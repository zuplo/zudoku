import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { setStandaloneConfig } from "./src/config/loader.js";
import vitePlugin from "./src/vite/plugin.js";

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
    emptyOutDir: true,
    target: "es2022",
    outDir: path.resolve(__dirname, "standalone"),
    lib: {
      entry: ["src/app/standalone.tsx", "src/app/demo.tsx"],
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
    rolldownOptions: {
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
  plugins: [
    vitePlugin(),
    {
      name: "copy-standalone-html",
      closeBundle() {
        const outDir = path.resolve(__dirname, "standalone");
        const srcApp = path.resolve(__dirname, "src/app");

        [
          ["standalone.html", "standalone.html"],
          ["demo.html", "demo.html"],
          ["demo-cdn.html", "index.html"],
        ].forEach(([src, dest]) => {
          fs.copyFileSync(path.join(srcApp, src), path.join(outDir, dest));
        });
      },
    },
  ],
});
