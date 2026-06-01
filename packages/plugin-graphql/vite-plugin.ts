import fs from "node:fs/promises";
import path from "node:path";
import {
  buildSchema,
  getIntrospectionQuery,
  introspectionFromSchema,
  type IntrospectionOptions,
  type IntrospectionQuery,
} from "graphql";
import { joinUrl } from "zudoku";
import { getPluginConfigs, getZudokuConfig, type Plugin } from "zudoku/vite";
import { type GraphQLConfig, GRAPHQL_PLUGIN_NAME } from "./src/interfaces.js";
import { buildManifest } from "./src/util/manifest.js";

const MANIFEST_ID = "virtual:@zudoku/plugin-graphql/schema";
const SCHEMA_PREFIX = `${MANIFEST_ID}/`;

// Versioned inputs (input as array) are not supported yet, so only single-input
// instances get a schema baked.
const hasStringInput = (
  config: GraphQLConfig,
): config is GraphQLConfig & { input: string } =>
  typeof config.input === "string";

const slugify = (value: string) =>
  value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "schema";

const resolveInputPath = (
  config: GraphQLConfig & { input: string },
  rootDir: string,
) =>
  path.isAbsolute(config.input)
    ? config.input
    : path.join(rootDir, config.input);

const sharedIntrospectionOptions = {
  inputValueDeprecation: true,
  specifiedByUrl: true,
  schemaDescription: true,
} satisfies IntrospectionOptions;

const loadSchema = async (
  config: GraphQLConfig & { input: string },
  rootDir: string,
): Promise<IntrospectionQuery> => {
  if (config.type === "url") {
    const response = await fetch(config.input, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: getIntrospectionQuery(sharedIntrospectionOptions),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch GraphQL schema from ${config.input}: ${response.statusText}`,
      );
    }
    const json = (await response.json()) as { data: IntrospectionQuery };

    return json.data;
  }

  const sdl = await fs.readFile(resolveInputPath(config, rootDir), "utf-8");

  return introspectionFromSchema(buildSchema(sdl), sharedIntrospectionOptions);
};

type Instance = {
  config: GraphQLConfig & { input: string };
  basePath: string;
  slug: string;
  rootDir: string;
};

const getInstances = (): Instance[] => {
  const rootDir = getZudokuConfig().__meta.rootDir;
  return getPluginConfigs<GraphQLConfig>(GRAPHQL_PLUGIN_NAME)
    .filter(hasStringInput)
    .map((config) => {
      const basePath = joinUrl(config.path);
      return { config, basePath, slug: slugify(basePath), rootDir };
    });
};

export const graphqlSchemaPlugin = (): Plugin => {
  const resolvedManifestId = `\0${MANIFEST_ID}`;
  const resolvedSchemaPrefix = `\0${SCHEMA_PREFIX}`;

  return {
    name: "zudoku-plugin-graphql:schema",
    resolveId(id) {
      if (id === MANIFEST_ID) return resolvedManifestId;
      if (id.startsWith(SCHEMA_PREFIX)) return `\0${id}`;
    },
    async load(id) {
      // Names-only manifest + lazy loaders. Stays inlined in the entry bundle;
      // each loader dynamically imports a per-schema virtual module so the full
      // introspection is code-split out and only fetched on a GraphQL page.
      if (id === resolvedManifestId) {
        const instances = getInstances();
        if (instances.length === 0) {
          return `export const manifests = {};\nexport const loaders = {};`;
        }

        const manifests: Record<string, ReturnType<typeof buildManifest>> = {};
        for (const instance of instances) {
          // Vite reloads both the client and the SSR module runner when a
          // watched file changes; a manual watcher would only reach the client.
          if (instance.config.type === "file") {
            this.addWatchFile(
              resolveInputPath(instance.config, instance.rootDir),
            );
          }
          manifests[instance.basePath] = buildManifest(
            await loadSchema(instance.config, instance.rootDir),
          );
        }

        const loaders = instances.map(
          (instance) =>
            `  ${JSON.stringify(instance.basePath)}: () => import(${JSON.stringify(
              `${SCHEMA_PREFIX}${instance.slug}`,
            )}),`,
        );

        return [
          `export const manifests = ${JSON.stringify(manifests)};`,
          `export const loaders = {`,
          ...loaders,
          `};`,
        ].join("\n");
      }

      // Per-schema module: full introspection via JSON.parse (faster than a JS
      // object literal at scale). addWatchFile reloads client + SSR on change.
      if (id.startsWith(resolvedSchemaPrefix)) {
        const slug = id.slice(resolvedSchemaPrefix.length);
        const instance = getInstances().find((i) => i.slug === slug);
        if (!instance) return;

        if (instance.config.type === "file") {
          this.addWatchFile(
            resolveInputPath(instance.config, instance.rootDir),
          );
        }
        const introspection = await loadSchema(
          instance.config,
          instance.rootDir,
        );

        return `export default JSON.parse(${JSON.stringify(
          JSON.stringify(introspection),
        )});`;
      }
    },
  };
};
