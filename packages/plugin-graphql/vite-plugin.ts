import fs from "node:fs/promises";
import path from "node:path";
import {
  buildSchema,
  getIntrospectionQuery,
  introspectionFromSchema,
  type IntrospectionQuery,
} from "graphql";
import { joinUrl } from "zudoku";
import { getPluginConfigs, getZudokuConfig, type Plugin } from "zudoku/vite";
import { type GraphQLConfig, GRAPHQL_PLUGIN_NAME } from "./src/interfaces.js";

// Versioned inputs (input as array) are not supported yet, so only single-input
// instances get a schema baked.
const hasStringInput = (
  config: GraphQLConfig,
): config is GraphQLConfig & { input: string } =>
  typeof config.input === "string";

const loadSchema = async (
  config: GraphQLConfig & { input: string },
  rootDir: string,
): Promise<IntrospectionQuery> => {
  if (config.type === "url") {
    const response = await fetch(config.input, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: getIntrospectionQuery() }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch GraphQL schema from ${config.input}: ${response.statusText}`,
      );
    }
    const json = (await response.json()) as { data: IntrospectionQuery };

    return json.data;
  }

  const filePath = path.isAbsolute(config.input)
    ? config.input
    : path.join(rootDir, config.input);
  const sdl = await fs.readFile(filePath, "utf-8");

  return introspectionFromSchema(buildSchema(sdl));
};

export const graphqlSchemaPlugin = (): Plugin => {
  const virtualId = "virtual:@zudoku/plugin-graphql/schema";
  const resolvedId = `\0${virtualId}`;

  return {
    name: "zudoku-plugin-graphql:schema",
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    async load(id) {
      if (id !== resolvedId) return;

      const zudokuConfig = getZudokuConfig();
      const configs = getPluginConfigs<GraphQLConfig>(GRAPHQL_PLUGIN_NAME);
      if (configs.length === 0) {
        return `export default {};`;
      }

      const rootDir = zudokuConfig.__meta.rootDir;
      const entries = await Promise.all(
        configs
          .filter(hasStringInput)
          .map(async (config) => [
            joinUrl(config.path),
            await loadSchema(config, rootDir),
          ]),
      );

      return `export default ${JSON.stringify(Object.fromEntries(entries))};`;
    },
  };
};
