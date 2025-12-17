import type { IntrospectionQuery } from "graphql";
import type { RouteObject } from "zudoku/router";
import { GraphQLProvider } from "../context.js";
import type { GraphQLPluginOptions } from "../interfaces.js";
import {
  findMutationFields,
  findQueryFields,
  findSubscriptionFields,
  findTypes,
} from "../util/findType.js";
import { ROOT_TYPES } from "../util/types.js";

type RouteConfig = {
  basePath: string;
  schema: IntrospectionQuery;
  options: GraphQLPluginOptions;
};

const createGraphQLProvider = (
  config: RouteConfig,
  children: RouteObject[],
): RouteObject => ({
  path: config.basePath,
  async lazy() {
    const { Outlet } = await import("zudoku/router");
    const { GraphQLWorkbenchProvider } =
      await import("../components/GraphQLWorkbench.js");
    return {
      element: (
        <GraphQLProvider
          value={{
            schema: config.schema.__schema,
            basePath: config.basePath,
            options: config.options,
          }}
        >
          <GraphQLWorkbenchProvider>
            <Outlet />
          </GraphQLWorkbenchProvider>
        </GraphQLProvider>
      ),
    };
  },
  children,
});

const createOverviewRoute = (): RouteObject => ({
  index: true,
  async lazy() {
    const { OverviewPage } = await import("../pages/OverviewPage.js");
    return { element: <OverviewPage /> };
  },
});

const createPlaygroundRoute = (): RouteObject => ({
  path: "playground",
  async lazy() {
    const { PlaygroundPage } = await import("../pages/PlaygroundPage.js");
    return { element: <PlaygroundPage /> };
  },
});

const createTypeListRoute = (kind: string): RouteObject => ({
  path: kind,
  async lazy() {
    const { TypeListPage } = await import("../pages/TypeListPage.js");
    return { element: <TypeListPage kind={kind} /> };
  },
});

const createTypeDetailRoute = (kind: string, name: string): RouteObject => ({
  path: `${kind}/${name}`,
  async lazy() {
    const { TypeDetailPage } = await import("../pages/TypeDetailPage.js");
    return { element: <TypeDetailPage kind={kind} name={name} /> };
  },
});

const createOperationRoute = (kind: string, name: string): RouteObject => ({
  path: `${kind}/${name}`,
  async lazy() {
    const { OperationPage } = await import("../pages/OperationPage.js");
    return { element: <OperationPage kind={kind} name={name} /> };
  },
});

const OPERATION_GROUPS = [
  { rootType: ROOT_TYPES.QUERY, find: findQueryFields },
  { rootType: ROOT_TYPES.MUTATION, find: findMutationFields },
  { rootType: ROOT_TYPES.SUBSCRIPTION, find: findSubscriptionFields },
] as const;

const TYPE_GROUPS = [
  { rootType: ROOT_TYPES.OBJECT, kind: "OBJECT" },
  { rootType: ROOT_TYPES.INPUT_OBJECT, kind: "INPUT_OBJECT" },
  { rootType: ROOT_TYPES.ENUM, kind: "ENUM" },
  { rootType: ROOT_TYPES.SCALAR, kind: "SCALAR" },
  { rootType: ROOT_TYPES.INTERFACE, kind: "INTERFACE" },
  { rootType: ROOT_TYPES.UNION, kind: "UNION" },
] as const;

export const getRoutes = (config: RouteConfig): RouteObject[] => {
  const gqlSchema = config.schema.__schema;
  const routes: RouteObject[] = [createOverviewRoute()];

  if (config.options.playground?.enabled !== false) {
    routes.push(createPlaygroundRoute());
  }

  for (const { rootType, find } of OPERATION_GROUPS) {
    const fields = find(gqlSchema);
    if (fields.length === 0) continue;
    routes.push(createTypeListRoute(rootType));
    for (const field of fields) {
      routes.push(createOperationRoute(rootType, field.name));
    }
  }

  for (const { rootType, kind } of TYPE_GROUPS) {
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
    routes.push(createTypeListRoute(rootType));
    for (const type of types) {
      routes.push(createTypeDetailRoute(rootType, type.name));
    }
  }

  return [createGraphQLProvider(config, routes)];
};
