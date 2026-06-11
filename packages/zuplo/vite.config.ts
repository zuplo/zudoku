import { graphqlSchemaPlugin } from "@zudoku/plugin-graphql/vite-plugin";
import { zuploVitePlugin } from "@zuplo/zudoku/vite-plugin";
import type { UserConfig } from "zudoku/vite";

// Merged into the Zudoku Vite config whenever the Zuplo plugin is active
// (applied automatically in Zuplo mode). The GraphQL schema plugin is included
// here since the GraphQL plugin instances are created by `zuploPlugin` rather
// than the user's config.
export default {
  plugins: [zuploVitePlugin(), graphqlSchemaPlugin()],
  // Both packages import virtual modules that esbuild can't resolve during
  // dependency pre-bundling
  optimizeDeps: { exclude: ["@zuplo/zudoku", "@zudoku/plugin-graphql"] },
} satisfies UserConfig;
