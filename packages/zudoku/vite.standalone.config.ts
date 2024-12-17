import autoprefixer from "autoprefixer";
import path from "path";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tailwindConfig from "./src/app/tailwind.js";
import { getPluginOptions } from "./src/vite/config.js";
import vitePlugin from "./src/vite/plugin.js";

const entries: Record<string, string> = {
  standalone: "./src/app/standalone.tsx",
  demo: "./src/app/demo.tsx",
};

const config = {
  ...getPluginOptions({
    mode: "standalone",
    dir: path.resolve(__dirname),
  }),
  __meta: {},
};

export default defineConfig({
  worker: {
    format: "es",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
  build: {
    sourcemap: true,
    outDir: path.resolve(__dirname, "standalone"),
    lib: {
      entry: Object.entries(entries).reduce((acc, [key, value]) => {
        acc[key] = path.resolve(__dirname, value);
        return acc;
      }, {}),
      name: "Zudoku",
      formats: ["es"],
      fileName: (format, fileName) => {
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
  plugins: [vitePlugin(config)],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          ...tailwindConfig(),
          content: ["./src/lib/**/*.{js,ts,jsx,tsx}"],
        }),
        autoprefixer,
      ],
    },
  },
});
