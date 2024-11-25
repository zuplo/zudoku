import { glob } from "glob";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, type Plugin } from "vite";
import pkgJson from "./package.json";

const uiComponents = Object.fromEntries(
  glob.sync("./src/lib/ui/**/*.{ts,tsx}").map((file) => {
    return [`ui/${path.basename(file).replace(/\.tsx?$/, "")}`, file];
  }),
);

const entries: Record<string, string> = {
  components: "./src/lib/components/index.ts",
  icons: "./src/lib/icons.ts",
  "auth-clerk": "./src/lib/authentication/providers/clerk.tsx",
  "auth-auth0": "./src/lib/authentication/providers/auth0.tsx",
  "auth-openid": "./src/lib/authentication/providers/openid.tsx",
  "plugin-api-keys": "./src/lib/plugins/api-keys/index.tsx",
  "plugin-markdown": "./src/lib/plugins/markdown/index.tsx",
  "plugin-openapi": "./src/lib/plugins/openapi/index.tsx",
  "plugin-redirect": "./src/lib/plugins/redirect/index.tsx",
  "plugin-custom-pages": "./src/lib/plugins/custom-pages/index.tsx",
  "plugin-search-inkeep": "./src/lib/plugins/search-inkeep/index.tsx",
  ...uiComponents,
};

// Fixes the worker import paths
// See: https://github.com/vitejs/vite/issues/15618
const fixWorkerPathsPlugin = (): Plugin => ({
  name: "fix-worker-paths",
  apply: "build",
  generateBundle(_, bundle) {
    Object.values(bundle).forEach((chunk) => {
      if (chunk.type === "chunk" && chunk.fileName.endsWith(".js")) {
        chunk.code = chunk.code.replaceAll('"/assets/', '"./assets/');
      }
    });
  },
});

export default defineConfig({
  worker: {
    format: "es",
  },
  resolve: {
    alias: [
      { find: /^zudoku\/ui\/(.*).js/, replacement: `./src/lib/ui/$1.tsx` },
    ],
  },
  build: {
    sourcemap: true,
    outDir: path.resolve(__dirname, "lib"),
    lib: {
      entry: Object.entries(entries).reduce((acc, [key, value]) => {
        acc[key] = path.resolve(__dirname, value);
        return acc;
      }, {}),
      name: "Zudoku",
      formats: ["es"],
      fileName: (_format, fileName) => {
        return fileName.startsWith("ui/")
          ? `${fileName}.js`
          : `zudoku.${fileName}.js`;
      },
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "lucide-react",
        /@radix-ui/,

        // Optional Modules (i.e. auth providers) are external as we don't
        // want to bundle these in the library. Users will install these
        // themselves and they will be bundled in their app
        ...Object.keys(pkgJson.optionalDependencies),
      ],
      plugins: [visualizer(), fixWorkerPathsPlugin()],
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
});
