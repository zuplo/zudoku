import fs from "node:fs/promises";
import path from "node:path";
import type { GraphQLConfig } from "@zudoku/plugin-graphql";
import type { ZudokuConfig } from "zudoku";
import type { ZuploApiEntry, ZuploClientContext } from "../context.js";
import { ensureArray } from "../util/ensureArray.js";
import { joinUrl } from "../util/joinUrl.js";
import { slugify } from "../util/slugify.js";
import type { RecordAny } from "../util/types.js";
import { operations } from "./processors/enrich-with-zuplo.js";

const OAS_SUFFIX = ".oas.json";

// Configs of plugins created via `createPlugin(name, ...)` are tagged under
// this symbol (see zudoku's plugin-config); used to detect user-configured
// GraphQL plugin instances.
const PLUGIN_CONFIG = Symbol.for("zudoku.pluginConfig");

// biome-ignore lint/suspicious/noConsole: Logging allowed here
const warn = (message: string) => console.warn(`[zuplo] ${message}`);

export type InspectZuploContextOptions = {
  /** The dev portal root directory (where the Zudoku config lives) */
  rootDir: string;
  /** The user's Zudoku config, used to skip already configured APIs/endpoints */
  config?: ZudokuConfig;
};

type GraphQLRoute = {
  routePath: string;
  summary?: string;
  description?: string;
};

const normalizeNavPath = (value: string) => `/${value.replace(/^\/+/, "")}`;

const getUserGraphQLConfigs = (config?: ZudokuConfig): GraphQLConfig[] =>
  (config?.plugins ?? []).flatMap((plugin) => {
    const tag =
      plugin && typeof plugin === "object"
        ? (plugin as { [PLUGIN_CONFIG]?: { name: string; config: unknown } })[
            PLUGIN_CONFIG
          ]
        : undefined;
    return tag?.name === "graphql" ? [tag.config as GraphQLConfig] : [];
  });

const buildGraphQLConfigs = (
  routes: GraphQLRoute[],
  config?: ZudokuConfig,
): GraphQLConfig[] => {
  if (routes.length === 0) return [];

  const serverUrl = process.env.ZUPLO_SERVER_URL;
  if (!serverUrl) {
    warn(
      `Found ${routes.length} GraphQL endpoint(s), but ZUPLO_SERVER_URL is not set. Skipping GraphQL documentation setup.`,
    );
    return [];
  }

  const userConfigs = getUserGraphQLConfigs(config);
  const usedPaths = new Set(
    userConfigs.flatMap((c) => (c.path ? [normalizeNavPath(c.path)] : [])),
  );
  const usedInputs = new Set(
    userConfigs.flatMap((c) =>
      c.type === "url" && typeof c.input === "string" ? [c.input] : [],
    ),
  );

  return routes.flatMap((route) => {
    const input = joinUrl(serverUrl, route.routePath);
    if (usedInputs.has(input)) return [];

    const slug = slugify(route.routePath);
    const basePath = slug.startsWith("graphql")
      ? `/${slug}`
      : `/graphql-${slug}`;

    let pathName = basePath;
    let suffix = 2;
    while (usedPaths.has(pathName)) {
      pathName = `${basePath}-${suffix}`;
      suffix++;
    }
    usedPaths.add(pathName);

    return [
      {
        type: "url" as const,
        input,
        path: pathName,
        options: {
          ...(route.summary ? { title: route.summary } : {}),
          ...(route.description ? { description: route.description } : {}),
        },
      },
    ];
  });
};

/**
 * Inspects a Zuplo project (the `../config` directory relative to the dev
 * portal root) and returns the detected OpenAPI files and GraphQL endpoints.
 *
 * - Every `*.oas.json` file becomes an `apis` entry (`routes.oas.json` is
 *   mounted at `/api`, other files at `/api-<name>`), unless the user's config
 *   already references the file or occupies the path.
 * - Every operation marked with `x-graphql: true` becomes a GraphQL plugin
 *   config that introspects the deployed gateway endpoint
 *   (`ZUPLO_SERVER_URL` + route path).
 */
export const inspectZuploContext = async ({
  rootDir,
  config,
}: InspectZuploContextOptions): Promise<ZuploClientContext> => {
  const configDir = path.resolve(rootDir, "../config");

  let fileNames: string[];
  try {
    fileNames = (await fs.readdir(configDir))
      .filter((fileName) => fileName.endsWith(OAS_SUFFIX))
      .sort();
  } catch {
    warn(`No Zuplo config directory found at ${configDir}`);
    return { apis: [], graphql: [] };
  }

  const userApis = config?.apis ? ensureArray(config.apis) : [];
  const configuredInputs = new Set(
    userApis.flatMap((api) =>
      "input" in api && api.input
        ? ensureArray(api.input).flatMap((input) =>
            // Versioned inputs are objects with their own `input` path
            typeof input === "string"
              ? [path.resolve(rootDir, input)]
              : [path.resolve(rootDir, input.input)],
          )
        : [],
    ),
  );
  const configuredPaths = new Set(
    userApis.flatMap((api) => (api.path ? [normalizeNavPath(api.path)] : [])),
  );

  const apis: ZuploApiEntry[] = [];
  // Keyed by route path so an endpoint referenced from multiple files is
  // documented once
  const graphqlRoutes = new Map<string, GraphQLRoute>();

  for (const fileName of fileNames) {
    const absolutePath = path.join(configDir, fileName);

    let document: RecordAny;
    try {
      document = JSON.parse(await fs.readFile(absolutePath, "utf-8"));
    } catch (error) {
      warn(`Skipping ${fileName}, could not parse it: ${error}`);
      continue;
    }

    for (const [routePath, pathItem] of Object.entries<RecordAny>(
      document.paths ?? {},
    )) {
      for (const method of operations) {
        const operation = pathItem?.[method];
        if (operation?.["x-graphql"] !== true) continue;
        if (graphqlRoutes.has(routePath)) continue;

        graphqlRoutes.set(routePath, {
          routePath,
          summary: operation.summary,
          description: operation.description,
        });
      }
    }

    if (configuredInputs.has(absolutePath)) continue;

    const slug = slugify(fileName.slice(0, -OAS_SUFFIX.length));
    const navPath = slug === "routes" ? "/api" : `/api-${slug}`;
    if (configuredPaths.has(navPath)) continue;
    configuredPaths.add(navPath);

    apis.push({
      type: "file",
      input: path.posix.join("..", "config", fileName),
      path: navPath,
    });
  }

  return {
    apis,
    graphql: buildGraphQLConfigs([...graphqlRoutes.values()], config),
  };
};
