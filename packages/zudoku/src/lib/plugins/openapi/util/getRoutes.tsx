import { redirect, type RouteObject } from "react-router";
import { joinUrl } from "../../../util/joinUrl.js";
import type { GraphQLClient } from "../client/GraphQLClient.js";
import { type OpenApiPluginOptions, UNTAGGED_PATH } from "../index.js";
import type { OasPluginConfig } from "../interfaces.js";

// Creates the main provider route that wraps operation routes.
const createOasProvider = (opts: {
  routePath: string;
  basePath: string;
  version?: string;
  routes: RouteObject[];
  client: GraphQLClient;
  config: OpenApiPluginOptions;
}): RouteObject => ({
  path: opts.routePath,
  async lazy() {
    const { OasProvider } = await import("../OasProvider.js");
    return {
      element: (
        <OasProvider
          basePath={opts.basePath}
          version={opts.version}
          client={opts.client}
          config={opts.config}
        />
      ),
    };
  },
  children: opts.routes,
});

// Creates a route for displaying the operation list used for both tagged and untagged operations.
const createRoute = ({
  path,
  tag,
  untagged,
}: {
  path: string;
  tag?: string;
  untagged?: boolean;
}): RouteObject => ({
  path,
  async lazy() {
    const { OperationList } = await import("../OperationList.js");
    return { element: <OperationList tag={tag} untagged={untagged} /> };
  },
});

const createAdditionalRoutes = (basePath: string) => [
  // Category without tagged operations
  createRoute({
    path: joinUrl(basePath, UNTAGGED_PATH),
    untagged: true,
  }),
  // Schema list route
  {
    path: joinUrl(basePath, "~schemas"),
    lazy: async () => {
      const { SchemaList } = await import("../SchemaList.js");
      return { element: <SchemaList /> };
    },
  },
];

// Creates routes for a specific version, including tag-based routes and the untagged operations route.
const createVersionRoutes = (
  versionPath: string,
  tagPages: string[],
): RouteObject[] => {
  const firstTagRoute = joinUrl(versionPath, tagPages.at(0) ?? UNTAGGED_PATH);

  return [
    // Redirect to first tag on the index route
    { index: true, loader: () => redirect(firstTagRoute) },
    // Create routes for each tag
    ...tagPages.map((tag) =>
      createRoute({
        path: joinUrl(versionPath, tag),
        tag,
      }),
    ),
    ...createAdditionalRoutes(versionPath),
  ];
};

export const getVersions = (config: OasPluginConfig) =>
  config.type === "file" ? Object.keys(config.input) : [];

export const getRoutes = ({
  basePath,
  config,
  client,
}: {
  client: GraphQLClient;
  config: OpenApiPluginOptions;
  basePath: string;
}): RouteObject[] => {
  const tagPages = config.tagPages;

  // If the config does not provide tag pages the catch-all
  // route handles all operations on a single page
  if (!tagPages) {
    return [
      createOasProvider({
        basePath,
        routePath: basePath,
        routes: [
          createRoute({ path: basePath + "/:tag?" }),
          ...createAdditionalRoutes(basePath),
        ],
        client,
        config,
      }),
    ];
  }

  const versions = getVersions(config);
  // The latest version always is added as index path
  const versionsInPath =
    versions.length > 1 ? [undefined, ...versions] : [undefined];

  return versionsInPath.map((version) => {
    const versionPath = joinUrl(basePath, version);
    return createOasProvider({
      basePath,
      version,
      routePath: versionPath,
      routes: createVersionRoutes(versionPath, tagPages),
      client,
      config,
    });
  });
};
