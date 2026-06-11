import { graphqlSchemaPlugin } from "@zudoku/plugin-graphql/vite-plugin";
import { zuploVitePlugin } from "@zuplo/zudoku/vite-plugin";
import type { UserConfig } from "zudoku/vite";

// Merged into the Zudoku Vite config whenever `zuploPlugin()` is configured.
// The GraphQL schema plugin is included here since the GraphQL plugin
// instances are created by `zuploPlugin` rather than the user's config.
export default {
  plugins: [zuploVitePlugin(), graphqlSchemaPlugin()],
} satisfies UserConfig;
