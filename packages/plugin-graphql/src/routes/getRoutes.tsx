import type { IntrospectionQuery } from "graphql";
import type { RouteObject } from "zudoku/router";
import { GraphQLProvider } from "../context.js";
import type { GraphQLPluginOptions } from "../interfaces.js";
import type { GraphQLManifest } from "../util/manifest.js";
import { buildSchemaIndex } from "../util/schemaIndex.js";
import { ROOT_TYPES, type RootType } from "../util/types.js";

type RouteConfig = {
  basePath: string;
  manifest: GraphQLManifest;
  options: GraphQLPluginOptions;
  loadSchema: () => Promise<IntrospectionQuery>;
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
    const introspection = await config.loadSchema();
    const schema = introspection.__schema;
    return {
      element: (
        <GraphQLProvider
          value={{
            schema,
            index: buildSchemaIndex(schema),
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

const OPERATION_ROOT_TYPES: RootType[] = [
  ROOT_TYPES.QUERY,
  ROOT_TYPES.MUTATION,
  ROOT_TYPES.SUBSCRIPTION,
];

const TYPE_ROOT_TYPES: RootType[] = [
  ROOT_TYPES.OBJECT,
  ROOT_TYPES.INPUT_OBJECT,
  ROOT_TYPES.ENUM,
  ROOT_TYPES.SCALAR,
  ROOT_TYPES.INTERFACE,
  ROOT_TYPES.UNION,
];

export const getRoutes = (config: RouteConfig): RouteObject[] => {
  const { manifest } = config;
  const routes: RouteObject[] = [createOverviewRoute()];

  if (config.options.playground?.enabled !== false) {
    routes.push(createPlaygroundRoute());
  }

  for (const rootType of OPERATION_ROOT_TYPES) {
    const names = manifest[rootType];
    if (names.length === 0) continue;
    routes.push(createTypeListRoute(rootType));
    for (const name of names) {
      routes.push(createOperationRoute(rootType, name));
    }
  }

  for (const rootType of TYPE_ROOT_TYPES) {
    const names = manifest[rootType];
    if (names.length === 0) continue;
    routes.push(createTypeListRoute(rootType));
    for (const name of names) {
      routes.push(createTypeDetailRoute(rootType, name));
    }
  }

  return [createGraphQLProvider(config, routes)];
};
