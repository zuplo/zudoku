import type { IntrospectionQuery } from "graphql";
import graphqlSchemas from "virtual:@zudoku/plugin-graphql/schema";
import { createPlugin, joinUrl, type NavigationItem } from "zudoku";
import type { ZudokuPlugin } from "zudoku";
import { matchPath } from "zudoku/router";
import {
  type GraphQLConfig,
  GRAPHQL_PLUGIN_NAME,
  type GraphQLPluginOptions,
} from "./interfaces.js";
import { getRoutes } from "./routes/getRoutes.js";
import {
  findMutationFields,
  findQueryFields,
  findSubscriptionFields,
  findTypes,
} from "./util/findType.js";
import { ROOT_TYPES, typeMetadata } from "./util/types.js";

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
    const getSchema = () => graphqlSchemas[basePath];

    return {
      getRoutes: () => {
        const schema = getSchema();
        if (!schema) return [];
        return getRoutes({
          basePath,
          schema,
          options,
        });
      },

      getNavigation: async (path) => {
        if (!matchPath({ path: basePath, end: false }, path)) {
          return [];
        }
        const schema = getSchema();
        if (!schema) return [];

        return buildNavigation(schema, basePath);
      },
    };
  },
);

const OPERATION_NAV_GROUPS = [
  { rootType: ROOT_TYPES.QUERY, find: findQueryFields },
  { rootType: ROOT_TYPES.MUTATION, find: findMutationFields },
  { rootType: ROOT_TYPES.SUBSCRIPTION, find: findSubscriptionFields },
] as const;

const TYPE_NAV_GROUPS = [
  { rootType: ROOT_TYPES.OBJECT, kind: "OBJECT" },
  { rootType: ROOT_TYPES.INPUT_OBJECT, kind: "INPUT_OBJECT" },
  { rootType: ROOT_TYPES.ENUM, kind: "ENUM" },
  { rootType: ROOT_TYPES.SCALAR, kind: "SCALAR" },
  { rootType: ROOT_TYPES.INTERFACE, kind: "INTERFACE" },
  { rootType: ROOT_TYPES.UNION, kind: "UNION" },
] as const;

const buildNavigation = (
  schema: IntrospectionQuery,
  basePath: string,
): NavigationItem[] => {
  const gqlSchema = schema.__schema;
  const navigation: NavigationItem[] = [
    { type: "link", label: "Overview", to: basePath },
  ];

  for (const { rootType, find } of OPERATION_NAV_GROUPS) {
    const fields = find(gqlSchema);
    if (fields.length === 0) continue;
    navigation.push({
      type: "category",
      label: typeMetadata[rootType].label,
      collapsible: true,
      collapsed: true,
      items: fields.map((field) => ({
        type: "link",
        label: field.name,
        to: joinUrl(basePath, rootType, field.name),
      })),
    });
  }

  for (const { rootType, kind } of TYPE_NAV_GROUPS) {
    const all = findTypes(gqlSchema, [kind]);
    const types =
      rootType === ROOT_TYPES.OBJECT
        ? all.filter(
            (t) =>
              t.name !== gqlSchema.queryType?.name &&
              t.name !== gqlSchema.mutationType?.name &&
              t.name !== gqlSchema.subscriptionType?.name,
          )
        : all;
    if (types.length === 0) continue;
    navigation.push({
      type: "link",
      label: typeMetadata[rootType].label,
      to: joinUrl(basePath, rootType),
      badge: { label: String(types.length), color: "outline" },
    });
  }

  return navigation;
};

export type { GraphQLConfig, GraphQLPluginOptions } from "./interfaces.js";
