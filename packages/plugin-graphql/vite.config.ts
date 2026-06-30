import { graphqlSchemaPlugin } from "@zudoku/plugin-graphql/vite-plugin";
import type { UserConfig } from "zudoku/vite";

export default { plugins: [graphqlSchemaPlugin()] } satisfies UserConfig;
