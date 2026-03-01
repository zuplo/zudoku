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
import type { OasPluginConfig, VersionEntry } from "../interfaces.js";

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

// Used when tagPages is not configured (e.g. URL schemas). Resolves tags at
// runtime via GraphQL and redirects to the first available tag.
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

const createAdditionalRoutes = ({
  basePath,
  hasUntaggedOperations = true,
}: {
  basePath: string;
  hasUntaggedOperations?: boolean;
}) => [
  ...(hasUntaggedOperations
    ? [
        createRoute({
          path: joinUrl(basePath, UNTAGGED_PATH),
          untagged: true,
        }),
      ]
    : []),
  {
    path: joinUrl(basePath, "~schemas"),
    lazy: async () => {
      const { SchemaList } = await import("../SchemaList.js");
      return { element: <SchemaList /> };
    },
  },
];

const createVersionRoutes = ({
  versionPath,
  tagPages,
  hasUntaggedOperations = true,
}: {
  versionPath: string;
  tagPages: string[];
  hasUntaggedOperations?: boolean;
}): RouteObject[] => {
  const firstTag =
    tagPages.at(0) ?? (hasUntaggedOperations ? UNTAGGED_PATH : undefined);

  const indexRoute: RouteObject = firstTag
    ? { index: true, loader: () => redirect(joinUrl(versionPath, firstTag)) }
    : createRoute({ path: versionPath });

  return [
    indexRoute,
    ...tagPages.map((tag) =>
      createRoute({ path: joinUrl(versionPath, tag), tag }),
    ),
    ...createAdditionalRoutes({ basePath: versionPath, hasUntaggedOperations }),
  ];
};

export const getVersionMetadata = (config: OasPluginConfig) => {
  if (config.type === "raw" || !Array.isArray(config.input)) {
    return {
      versions: [] as string[],
      versionMap: {} as Record<
        string,
        { label: string; downloadUrl?: string; tagPages?: string[] }
      >,
    };
  }

  return {
    versions: config.input.map((v) => v.path),
    versionMap: Object.fromEntries(
      config.input.map((v) => [
        v.path,
        {
          label: v.label ?? v.path,
          downloadUrl: v.downloadUrl,
          tagPages: v.tagPages,
        },
      ]),
    ),
  };
};

/**
 * Build the target URL when switching versions. Preserves the current tag
 * if it exists in the target version, otherwise navigates to the version
 * root (which redirects to its first tag).
 */
export const buildVersionSwitchUrl = (
  target: VersionEntry,
  currentTag: string | undefined,
) => {
  const tagExistsInTarget =
    currentTag && (!target.tagPages || target.tagPages.includes(currentTag));

  if (!tagExistsInTarget) return target.path;

  return joinUrl(target.path, currentTag);
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
  const inputArray = Array.isArray(config.input) ? config.input : undefined;

  // undefined entry = index path that serves the latest version
  const versionsInPath =
    versions.length > 1 ? [undefined, ...versions] : [undefined];

  return versionsInPath.map((version) => {
    const versionPath = joinUrl(basePath, version);
    const versionInput = version
      ? inputArray?.find((v) => v.path === version)
      : inputArray?.[0];
    const hasUntaggedOperations = versionInput?.hasUntaggedOperations ?? true;

    const versionTagPages = versionInput?.tagPages ?? tagPages;

    return createOasProvider({
      basePath,
      version,
      routePath: versionPath,
      routes: versionTagPages
        ? createVersionRoutes({
            versionPath,
            tagPages: versionTagPages,
            hasUntaggedOperations,
          })
        : [
            createNonTagPagesRoute({ path: `${versionPath}/:tag?` }),
            ...createAdditionalRoutes({
              basePath: versionPath,
              hasUntaggedOperations,
            }),
          ],
      client,
      config,
    });
  });
};
