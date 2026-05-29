import { loaders, manifests } from "virtual:@zudoku/plugin-graphql/schema";
import { createPlugin, joinUrl, type NavigationItem } from "zudoku";
import type { ZudokuPlugin } from "zudoku";
import { matchPath } from "zudoku/router";
import {
  type GraphQLConfig,
  GRAPHQL_PLUGIN_NAME,
  type GraphQLPluginOptions,
} from "./interfaces.js";
import { getRoutes } from "./routes/getRoutes.js";
import type { GraphQLManifest } from "./util/manifest.js";
import { ROOT_TYPES, type RootType, typeMetadata } from "./util/types.js";

const resolveOptions = (
  config: GraphQLConfig,
): { basePath: string; options: GraphQLPluginOptions } => {
  const playgroundEndpoint =
    config.options?.playground?.endpoint ??
    (config.type === "url" && typeof config.input === "string"
      ? config.input
      : undefined);

  const options: GraphQLPluginOptions = {
    ...config.options,
    playground: {
      ...config.options?.playground,
      endpoint: playgroundEndpoint,
    },
  };

  return {
    basePath: joinUrl(config.path),
    options,
  };
};

export const graphqlPlugin = createPlugin(
  GRAPHQL_PLUGIN_NAME,
  (config: GraphQLConfig): ZudokuPlugin => {
    const { basePath, options } = resolveOptions(config);

    return {
      getRoutes: () => {
        const manifest = manifests[basePath];
        const loadSchema = loaders[basePath];
        if (!manifest || !loadSchema) return [];
        return getRoutes({
          basePath,
          manifest,
          options,
          loadSchema: () => loadSchema().then((module) => module.default),
        });
      },

      getNavigation: async (path) => {
        if (!matchPath({ path: basePath, end: false }, path)) {
          return [];
        }
        const manifest = manifests[basePath];
        if (!manifest) return [];

        return buildNavigation(manifest, basePath);
      },
    };
  },
);

const OPERATION_NAV_ROOT_TYPES: RootType[] = [
  ROOT_TYPES.QUERY,
  ROOT_TYPES.MUTATION,
  ROOT_TYPES.SUBSCRIPTION,
];

const TYPE_NAV_ROOT_TYPES: RootType[] = [
  ROOT_TYPES.OBJECT,
  ROOT_TYPES.INPUT_OBJECT,
  ROOT_TYPES.ENUM,
  ROOT_TYPES.SCALAR,
  ROOT_TYPES.INTERFACE,
  ROOT_TYPES.UNION,
];

const SIDEBAR_ITEM_LIMIT = 8;

const buildNavigation = (
  manifest: GraphQLManifest,
  basePath: string,
): NavigationItem[] => {
  const navigation: NavigationItem[] = [
    { type: "link", label: "Overview", to: basePath },
  ];

  for (const rootType of OPERATION_NAV_ROOT_TYPES) {
    const names = manifest[rootType];
    if (names.length === 0) continue;
    const listPath = joinUrl(basePath, rootType);
    const items: NavigationItem[] = names
      .slice(0, SIDEBAR_ITEM_LIMIT)
      .map((name) => ({
        type: "link",
        label: name,
        to: joinUrl(basePath, rootType, name),
      }));
    if (names.length > SIDEBAR_ITEM_LIMIT) {
      items.push({
        type: "link",
        label: `View all (${names.length})`,
        to: listPath,
      });
    }
    navigation.push({
      type: "category",
      label: typeMetadata[rootType].label,
      collapsible: true,
      collapsed: true,
      link: { type: "link", to: listPath },
      items,
    });
  }

  for (const rootType of TYPE_NAV_ROOT_TYPES) {
    const names = manifest[rootType];
    if (names.length === 0) continue;
    navigation.push({
      type: "link",
      label: typeMetadata[rootType].label,
      to: joinUrl(basePath, rootType),
      badge: { label: String(names.length), color: "outline" },
    });
  }

  return navigation;
};

export type { GraphQLConfig, GraphQLPluginOptions } from "./interfaces.js";
