import type { UserConfig } from "zudoku/vite";
import { graphqlSchemaPlugin } from "./vite-plugin.js";

export default { plugins: [graphqlSchemaPlugin()] } satisfies UserConfig;
