import { graphqlSchemaPlugin } from "@zudoku/plugin-graphql/vite-plugin";
import { zuploContextPlugin } from "@zudoku/zuplo/vite-plugin";
import type { UserConfig } from "zudoku/vite";

// graphqlSchemaPlugin is always included (not only when GraphQL endpoints were
// detected) because the client entry statically imports the GraphQL plugin,
// whose schema manifest virtual module must resolve even when empty.
export default {
  plugins: [zuploContextPlugin(), graphqlSchemaPlugin()],
} satisfies UserConfig;
