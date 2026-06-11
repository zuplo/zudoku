import { type GraphQLConfig, graphqlPlugin } from "@zudoku/plugin-graphql";
import type { ZudokuConfig } from "zudoku";
import { selectPluginConfigs } from "zudoku/plugins";
import type { ZuploContext, ZuploOpenApiFile } from "./context/types.js";
import type { ZuploPluginOptions } from "./options.js";

const API_BASE_PATH = "/api";

type ApiConfig = Exclude<ZudokuConfig["apis"], readonly unknown[] | undefined>;

const ensureArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const normalizePath = (path: string) => `/${path.replace(/^\/+|\/+$/g, "")}`;

const fileBase = (fileName: string) => fileName.slice(0, -".oas.json".length);

// A discovered file is skipped when the user already references it in `apis`,
// no matter from where, so their manual setup wins.
const referencesFile = (api: ApiConfig, fileName: string): boolean => {
  if (api.type !== "file") return false;

  return ensureArray(api.input)
    .map((input) => (typeof input === "string" ? input : input.input))
    .some((input) =>
      input.replaceAll("\\", "/").endsWith(`/config/${fileName}`),
    );
};

/**
 * Builds the Zudoku config for the given Zuplo context: an OpenAPI reference
 * per OpenAPI file and a GraphQL reference per GraphQL endpoint. Anything the
 * user configured themselves is left untouched and takes precedence.
 *
 * Runs both during config loading (Node) and inside the client/server bundles,
 * so it must stay deterministic and browser-safe.
 */
export const applyZuploConfig = (
  config: ZudokuConfig,
  context: ZuploContext,
  options: ZuploPluginOptions = {},
): { config: ZudokuConfig; graphqlRoutePaths: string[] } => {
  const userApis = ensureArray(config.apis);
  const userGraphqlPaths = selectPluginConfigs<GraphQLConfig>(
    config.plugins ?? [],
    "graphql",
  ).map((graphqlConfig) => normalizePath(graphqlConfig.path));

  const takenPaths = new Set<string>([
    ...userApis.flatMap((api) => (api.path ? [normalizePath(api.path)] : [])),
    ...userGraphqlPaths,
  ]);

  const discoveredFiles =
    options.openApi === false
      ? []
      : context.openApiFiles.filter(
          (file) => !userApis.some((api) => referencesFile(api, file.fileName)),
        );

  const apiForFile = (file: ZuploOpenApiFile): ApiConfig | undefined => {
    // A project with a single API lives at /api; with multiple APIs each file
    // gets its own path derived from its name, e.g. legacy.oas.json -> /api/legacy
    const candidates =
      context.openApiFiles.length === 1
        ? [API_BASE_PATH, `${API_BASE_PATH}/${fileBase(file.fileName)}`]
        : [`${API_BASE_PATH}/${fileBase(file.fileName)}`];

    const apiPath = candidates.find((path) => !takenPaths.has(path));
    if (!apiPath) return;

    takenPaths.add(apiPath);
    return { type: "file", input: file.input, path: apiPath };
  };

  const discoveredApis = discoveredFiles.flatMap((file) => {
    const api = apiForFile(file);
    return api ? [api] : [];
  });

  const endpoints =
    options.graphql === false
      ? []
      : context.graphqlEndpoints.filter(
          (endpoint) => !takenPaths.has(normalizePath(endpoint.routePath)),
        );

  const graphqlPlugins = endpoints.map((endpoint) =>
    graphqlPlugin({
      type: "url",
      input: endpoint.url,
      path: endpoint.routePath,
      options: {
        title: endpoint.title,
        description: endpoint.description,
      },
    }),
  );

  return {
    config: {
      ...config,
      ...(discoveredApis.length > 0 && {
        apis: [...userApis, ...discoveredApis],
      }),
      ...(graphqlPlugins.length > 0 && {
        plugins: [...(config.plugins ?? []), ...graphqlPlugins],
      }),
    },
    graphqlRoutePaths: endpoints.map((endpoint) => endpoint.routePath),
  };
};
