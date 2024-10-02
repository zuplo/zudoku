import autoprefixer from "autoprefixer";
import { fileURLToPath } from "node:url";
import path from "path";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tailwindConfig from "./src/app/tailwind.js";
import { getStandaloneConfig } from "./src/vite/config.js";
import vitePlugin from "./src/vite/plugin.js";

const entries: Record<string, string> = {
  standalone: "./src/app/standalone.tsx",
  demo: "./src/app/demo.tsx",
};

const rootDir = path.dirname(fileURLToPath(import.meta.url));

process.env.ZUDOKU_ENV = "standalone";

export default defineConfig({
  mode: "standalone",
  worker: {
    format: "es",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
  build: {
    sourcemap: true,
    outDir: path.resolve(rootDir, "standalone"),
    lib: {
      entry: Object.entries(entries).reduce(
        (acc, [key, value]) => {
          acc[key] = path.resolve(__dirname, value);
          return acc;
        },
        {} as Record<string, string>,
      ),
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
  plugins: [vitePlugin(getStandaloneConfig(rootDir))],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          ...tailwindConfig,
          content: ["./src/lib/**/*.{js,ts,jsx,tsx}"],
        }),
        autoprefixer,
      ],
    },
  },
});
