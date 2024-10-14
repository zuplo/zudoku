import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import pkgJson from "./package.json";

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
  "openapi-worker": "./src/lib/plugins/openapi-worker.ts",
};

export default defineConfig({
  worker: {
    format: "es",
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
      fileName: (format, fileName) => {
        return `zudoku.${fileName}.js`;
      },
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "lucide-react",

        // Optional Modules (i.e. auth providers) are external as we don't
        // want to bundle these in the library. Users will install these
        // themselves and they will be bundled in their app
        ...Object.keys(pkgJson.optionalDependencies),

        // This is here because otherwise it tries to resolve at build time
        // we only want this to be resolved when the end app gets built
        "zudoku/openapi-worker",
      ],
      plugins: [visualizer()],
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
