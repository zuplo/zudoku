import path from "node:path";
import { glob } from "glob";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import pkgJson from "./package.json";

const entries: Record<string, string> = {
  components: "./src/lib/components/index.ts",
  icons: "./src/lib/icons.ts",
  "auth-clerk": "./src/lib/authentication/providers/clerk.tsx",
  "auth-auth0": "./src/lib/authentication/providers/auth0.tsx",
  "auth-openid": "./src/lib/authentication/providers/openid.tsx",
  "auth-azureb2c": "./src/lib/authentication/providers/azureb2c.tsx",
  "auth-supabase": "./src/lib/authentication/providers/supabase.tsx",
  plugins: "./src/lib/core/plugins.ts",
  hooks: "./src/lib/hooks/index.ts",
  router: "./src/lib/core/router.ts",
  __internal: "./src/lib/core/__internal.tsx",
  "plugin-api-keys": "./src/lib/plugins/api-keys/index.tsx",
  "plugin-markdown": "./src/lib/plugins/markdown/index.tsx",
  "plugin-openapi": "./src/lib/plugins/openapi/index.tsx",
  "plugin-redirect": "./src/lib/plugins/redirect/index.tsx",
  "plugin-custom-pages": "./src/lib/plugins/custom-pages/index.tsx",
  "plugin-search-inkeep": "./src/lib/plugins/search-inkeep/index.tsx",
  "plugin-search-pagefind": "./src/lib/plugins/search-pagefind/index.tsx",
  "plugin-api-catalog": "./src/lib/plugins/api-catalog/index.tsx",
  ...globEntries("./src/lib/ui/**/*.{ts,tsx}", "ui"),
  ...globEntries("./src/lib/plugins/openapi/processors/*.ts", "processors"),
};

export default defineConfig({
  resolve: {
    alias: [
      { find: /^zudoku\/ui\/(.*)\.js/, replacement: `./src/lib/ui/$1.tsx` },
    ],
  },
  build: {
    sourcemap: true,
    target: "es2022",
    outDir: path.resolve(__dirname, "lib"),
    lib: {
      entry: Object.entries(entries).reduce((acc, [key, value]) => {
        acc[key] = path.resolve(__dirname, value);
        return acc;
      }, {}),
      name: "Zudoku",
      formats: ["es"],
      fileName: (_format, fileName) =>
        fileName.startsWith("ui/") || fileName.startsWith("processors/")
          ? `${fileName}.js`
          : `zudoku.${fileName}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "lucide-react",
        /@radix-ui/,
        "@sentry/react",

        // Optional Modules (i.e. auth providers) are external as we don't
        // want to bundle these in the library. Users will install these
        // themselves and they will be bundled in their app
        // biome-ignore lint/complexity/useLiteralKeys: Might exist or not
        ...Object.keys(pkgJson?.["optionalDependencies"] ?? {}),
        // Peer dependencies should also be external
        // biome-ignore lint/complexity/useLiteralKeys: Might exist or not
        ...Object.keys(pkgJson?.["peerDependencies"] ?? {}),
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

// Globs files and returns all entries without file extension in a given folder
function globEntries(globString: string, distSubFolder = "") {
  return Object.fromEntries(
    glob
      .sync(globString, { ignore: "**/*.test.ts" })
      .map((file) => [path.join(distSubFolder, path.parse(file).name), file]),
  );
}
