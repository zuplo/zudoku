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
import { type AsyncApiPluginOptions, AsyncApiSchemaQuery } from "../index.js";

export const UNTAGGED_PATH = "~endpoints";

// Creates the main provider route that wraps operation routes.
const createAsyncApiProvider = (opts: {
  routePath: string;
  basePath: string;
  version?: string;
  routes: RouteObject[];
  client: GraphQLClient;
  config: AsyncApiPluginOptions;
}): RouteObject => ({
  path: opts.routePath,
  async lazy() {
    const { AsyncApiProvider } = await import("../AsyncApiProvider.js");
    return {
      element: (
        <AsyncApiProvider
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

// Creates a route for displaying the operation list
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
  const { tag: currentTag } = useParams();
  const location = useLocation();
  const query = useCreateQuery(AsyncApiSchemaQuery);
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

const createAdditionalRoutes = (basePath: string): RouteObject[] => [
  // Untagged operations
  createRoute({
    path: joinUrl(basePath, UNTAGGED_PATH),
    untagged: true,
  }),
];

// Creates routes for a specific version, including tag-based routes
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

export const getRoutes = ({
  basePath,
  config,
  client,
}: {
  client: GraphQLClient;
  config: AsyncApiPluginOptions;
  basePath: string;
}): RouteObject[] => {
  const tagPages = config.tagPages;

  // If the config does not provide tag pages, use a catch-all route
  if (!tagPages) {
    return [
      createAsyncApiProvider({
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

  // With tag pages defined
  return [
    createAsyncApiProvider({
      basePath,
      routePath: basePath,
      routes: createVersionRoutes(basePath, tagPages),
      client,
      config,
    }),
  ];
};
