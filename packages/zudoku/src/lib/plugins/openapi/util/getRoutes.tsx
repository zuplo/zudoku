import { useSuspenseQuery } from "@tanstack/react-query";
import {
  generatePath,
  Navigate,
  type RouteObject,
  redirect,
  useLocation,
  useParams,
} from "react-router";
import { joinUrl } from "../../../util/joinUrl.js";
import type { GraphQLClient } from "../client/GraphQLClient.js";
import { useCreateQuery } from "../client/useCreateQuery.js";
import { useOasConfig } from "../context.js";
import {
  GetNavigationOperationsQuery,
  type OpenApiPluginOptions,
  UNTAGGED_PATH,
} from "../index.js";
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

const NonTagPagesOperationList = ({
  render,
  path,
}: {
  render: (tag: string) => React.ReactNode;
  path: string;
}) => {
  const { type, input } = useOasConfig();
  const { tag: currentTag } = useParams();
  const location = useLocation();
  const query = useCreateQuery(GetNavigationOperationsQuery, { type, input });
  const {
    data: { schema },
  } = useSuspenseQuery(query);

  const firstTag = schema.tags.at(0);

  if (!currentTag && firstTag?.slug) {
    return (
      <Navigate
        to={{
          pathname: generatePath(path, { tag: firstTag.slug }),
          search: location.search,
        }}
      />
    );
  }

  if (currentTag && schema.tags.some((t) => t.slug === currentTag)) {
    return render(currentTag);
  }

  return null;
};

const createNonTagPagesRoute = ({ path }: { path: string }): RouteObject => ({
  path,
  async lazy() {
    const { OperationList } = await import("../OperationList.js");
    return {
      element: (
        <NonTagPagesOperationList
          path={path}
          render={(tag) => <OperationList tag={tag} />}
        />
      ),
    };
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

export const getVersionMetadata = (config: OasPluginConfig) => {
  if (config.type === "raw" || !Array.isArray(config.input)) {
    return { versions: [], labels: {}, downloadUrls: {} };
  }

  return {
    versions: config.input.map((v) => v.path),
    labels: Object.fromEntries(
      config.input.map((v) => [v.path, v.label ?? v.path]),
    ),
    downloadUrls: Object.fromEntries(
      config.input.map((v) => [v.path, v.downloadUrl]),
    ),
  };
};

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
  const { versions } = getVersionMetadata(config);

  // If the config does not provide tag pages the catch-all
  // route handles all operations on a single page
  if (!tagPages) {
    // If there are versions, create versioned routes even without tag pages
    if (versions.length > 0) {
      const versionsInPath =
        versions.length > 1 ? [undefined, ...versions] : [undefined];

      return versionsInPath.map((version) => {
        const versionPath = joinUrl(basePath, version);
        return createOasProvider({
          basePath,
          version,
          routePath: versionPath,
          routes: [
            createNonTagPagesRoute({ path: `${versionPath}/:tag?` }),
            ...createAdditionalRoutes(versionPath),
          ],
          client,
          config,
        });
      });
    }

    // No versions, single route
    return [
      createOasProvider({
        basePath,
        routePath: basePath,
        routes: [
          createNonTagPagesRoute({ path: `${basePath}/:tag?` }),
          ...createAdditionalRoutes(basePath),
        ],
        client,
        config,
      }),
    ];
  }

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
