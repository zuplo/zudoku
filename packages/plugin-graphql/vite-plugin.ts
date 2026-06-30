import fs from "node:fs/promises";
import path from "node:path";
import {
  buildSchema,
  getIntrospectionQuery,
  type IntrospectionOptions,
  introspectionFromSchema,
  type IntrospectionQuery,
} from "graphql";
import { z } from "zod/mini";
import {
  getPluginConfigs,
  getZudokuConfig,
  joinUrl,
  type Plugin,
} from "zudoku/vite";
import {
  type GraphQLConfig,
  GRAPHQL_PLUGIN_NAME,
  isSchemaUrl,
  resolveSchemaSource,
} from "./src/interfaces.js";
import { buildManifest } from "./src/util/manifest.js";

const MANIFEST_ID = "virtual:@zudoku/plugin-graphql/schema";
const SCHEMA_PREFIX = `${MANIFEST_ID}/`;

const slugify = (value: string) =>
  value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "schema";

const resolveSchemaPath = (
  config: GraphQLConfig & { schema: string },
  rootDir: string,
) =>
  path.isAbsolute(config.schema)
    ? config.schema
    : path.join(rootDir, config.schema);

const sharedIntrospectionOptions = {
  inputValueDeprecation: true,
  specifiedByUrl: true,
  schemaDescription: true,
} satisfies IntrospectionOptions;

// Validate the response envelope only: surface `errors` and require
// `data.__schema`. The full introspection shape is too large to model.
const IntrospectionResponseSchema = z.object({
  data: z.optional(z.object({ __schema: z.unknown() })),
  errors: z.optional(z.array(z.object({ message: z.string() }))),
});

const parseIntrospectionResponse = (
  json: unknown,
  source: string,
): IntrospectionQuery => {
  const parsed = IntrospectionResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Unexpected GraphQL introspection response from ${source}`);
  }
  if (parsed.data.errors && parsed.data.errors.length > 0) {
    throw new Error(
      `GraphQL introspection failed for ${source}: ${parsed.data.errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }
  if (!parsed.data.data) {
    throw new Error(
      `GraphQL introspection response from ${source} contained no data`,
    );
  }
  return parsed.data.data as IntrospectionQuery;
};

const fetchIntrospection = async (
  input: string,
  options?: IntrospectionOptions,
): Promise<IntrospectionQuery> => {
  const response = await fetch(input, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: getIntrospectionQuery(options) }),
  });
  // Servers return validation errors as 400 with a GraphQL error body, so
  // parse the body even on non-ok responses to surface the actual messages.
  const json = await response.json().catch(() => undefined);
  if (json === undefined) {
    throw new Error(
      `Failed to fetch GraphQL schema from ${input}: ${response.statusText}`,
    );
  }
  return parseIntrospectionResponse(json, input);
};

const loadSchemaSource = async (
  config: GraphQLConfig & { schema: string },
  rootDir: string,
): Promise<IntrospectionQuery> => {
  if (isSchemaUrl(config.schema)) {
    try {
      return await fetchIntrospection(
        config.schema,
        sharedIntrospectionOptions,
      );
    } catch {
      // Older servers reject the modern introspection fields
      // (specifiedByURL, schema description, input value deprecation);
      // retry with the plain query.
      return fetchIntrospection(config.schema);
    }
  }

  const sdl = await fs.readFile(resolveSchemaPath(config, rootDir), "utf-8");
  return introspectionFromSchema(buildSchema(sdl), sharedIntrospectionOptions);
};

const loadSchema = async (
  config: GraphQLConfig & { schema: string },
  rootDir: string,
): Promise<IntrospectionQuery> => {
  try {
    return await loadSchemaSource(config, rootDir);
  } catch (cause) {
    throw new Error(
      `Failed to load GraphQL schema "${config.schema}" for path "${config.path}".`,
      { cause },
    );
  }
};

type Instance = {
  config: GraphQLConfig & { schema: string };
  basePath: string;
  slug: string;
  rootDir: string;
};

// The manifest and the per-schema module both need the full introspection.
// Cache it per slug so a schema is loaded once (one network round-trip for URL
// inputs) instead of twice. Cleared on watchChange so edits stay fresh in dev.
const schemaCache = new Map<string, Promise<IntrospectionQuery>>();

const loadInstanceSchema = (
  instance: Instance,
): Promise<IntrospectionQuery> => {
  const cached = schemaCache.get(instance.slug);
  if (cached) return cached;
  const promise = loadSchema(instance.config, instance.rootDir);
  schemaCache.set(instance.slug, promise);
  return promise;
};

const getInstances = (): Instance[] => {
  const rootDir = getZudokuConfig().__meta.rootDir;
  return getPluginConfigs<GraphQLConfig>(GRAPHQL_PLUGIN_NAME).map((config) => {
    const schema = resolveSchemaSource(config);
    if (!schema) {
      throw new Error(
        `GraphQL plugin for path "${config.path}" has no schema to load. Set "schema" to a file path or URL, or set "endpoint" to a GraphQL URL to introspect.`,
      );
    }
    const basePath = joinUrl(config.path);
    return {
      config: { ...config, schema },
      basePath,
      slug: slugify(basePath),
      rootDir,
    };
  });
};

export const graphqlSchemaPlugin = (): Plugin => {
  const resolvedManifestId = `\0${MANIFEST_ID}`;
  const resolvedSchemaPrefix = `\0${SCHEMA_PREFIX}`;

  return {
    name: "zudoku-plugin-graphql:schema",
    config() {
      return { optimizeDeps: { include: ["graphql"] } };
    },
    resolveId(id) {
      if (id === MANIFEST_ID) return resolvedManifestId;
      if (id.startsWith(SCHEMA_PREFIX)) return `\0${id}`;
    },
    watchChange(id) {
      // Drop the cached schema for any file input that changed so the next
      // load re-reads it.
      for (const instance of getInstances()) {
        if (
          !isSchemaUrl(instance.config.schema) &&
          resolveSchemaPath(instance.config, instance.rootDir) === id
        ) {
          schemaCache.delete(instance.slug);
        }
      }
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
          // Load first so a missing/unloadable schema throws the wrapped error
          // before resolveSchemaPath can fail on an invalid schema value.
          manifests[instance.basePath] = buildManifest(
            await loadInstanceSchema(instance),
          );
          // Vite reloads both the client and the SSR module runner when a
          // watched file changes; a manual watcher would only reach the client.
          if (!isSchemaUrl(instance.config.schema)) {
            this.addWatchFile(
              resolveSchemaPath(instance.config, instance.rootDir),
            );
          }
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

        const introspection = await loadInstanceSchema(instance);
        if (!isSchemaUrl(instance.config.schema)) {
          this.addWatchFile(
            resolveSchemaPath(instance.config, instance.rootDir),
          );
        }

        return `export default JSON.parse(${JSON.stringify(
          JSON.stringify(introspection),
        )});`;
      }
    },
  };
};
