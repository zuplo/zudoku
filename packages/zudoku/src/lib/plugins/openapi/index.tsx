import { CirclePlayIcon, LogInIcon } from "lucide-react";
import { type ReactNode } from "react";
import { matchPath } from "react-router";
import { useAuth } from "../../authentication/hook.js";
import { type ZudokuPlugin } from "../../core/plugins.js";
import { Button } from "../../ui/Button.js";
import { joinUrl } from "../../util/joinUrl.js";
import { GraphQLClient } from "./client/GraphQLClient.js";
import type { GetSidebarOperationsQuery } from "./graphql/graphql.js";
import { graphql } from "./graphql/index.js";
import { type OasPluginConfig } from "./interfaces.js";
import type { PlaygroundContentProps } from "./playground/Playground.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";
import { createSidebarCategory } from "./util/createSidebarCategory.js";
import { getRoutes, getVersions } from "./util/getRoutes.js";

const GetSidebarOperationsQuery = graphql(`
  query GetSidebarOperations($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      tags {
        slug
        name
        extensions
        operations {
          summary
          slug
          method
          operationId
          path
        }
      }
      components {
        schemas {
          __typename
        }
      }
    }
  }
`);

export type OperationResult =
  GetSidebarOperationsQuery["schema"]["tags"][number]["operations"][number];

export type OpenApiPluginOptions = OasPluginConfig;

export const UNTAGGED_PATH = "~endpoints";

export const openApiPlugin = (config: OasPluginConfig): ZudokuPlugin => {
  const basePath = joinUrl(config.navigationId ?? "/reference");
  const client = new GraphQLClient(config);

  return {
    getHead: () => {
      if (config.type === "url" && !config.skipPreload) {
        return (
          <link
            rel="preload"
            href={config.input}
            as="fetch"
            crossOrigin="anonymous"
          />
        );
      }

      if (config.server) {
        return <link rel="preconnect" href={config.server} />;
      }
    },
    getMdxComponents: () => ({
      OpenPlaygroundButton: ({
        requireAuth,
        server,
        method,
        url,
        children,
        ...props
      }: Partial<PlaygroundContentProps> & { children: ReactNode } & Pick<
          PlaygroundContentProps,
          "server"
        > & {
          requireAuth: boolean;
        }) => {
        const auth = useAuth();

        if (!server) {
          throw new Error("Server is required");
        }

        if (requireAuth && !auth.isAuthenticated) {
          return (
            <Button
              className="gap-2 items-center"
              variant="outline"
              onClick={auth.login}
            >
              Login to open in Playground <LogInIcon size={16} />
            </Button>
          );
        }

        return (
          <PlaygroundDialog
            url={url ?? "/"}
            method={method ?? "get"}
            server={server}
            {...props}
          >
            <Button className="gap-2 items-center" variant="outline">
              {children ?? (
                <>
                  Open in Playground <CirclePlayIcon size={16} />
                </>
              )}
            </Button>
          </PlaygroundDialog>
        );
      },
    }),
    getSidebar: async (path, context) => {
      if (!matchPath({ path: basePath, end: false }, path)) {
        return [];
      }

      const match = matchPath(
        { path: `${basePath}/:version?/:tag`, end: true },
        path,
      );

      try {
        const versionParam = match?.params.version;
        const version = versionParam ?? getVersions(config).at(0);
        const { type } = config;
        const input = type === "file" ? config.input[version!] : config.input;

        const data = await context.queryClient.ensureQueryData({
          queryKey: ["sidebar-operations-query", input],
          queryFn: () =>
            client.fetch(GetSidebarOperationsQuery, { type, input }),
        });

        const categories = data.schema.tags.flatMap((tag) => {
          if (!tag.name || tag.operations.length === 0) return [];

          const categoryPath = joinUrl(basePath, versionParam, tag.slug);

          const isCollapsed =
            tag.extensions?.["x-zudoku-collapsed"] ??
            !config.options?.expandAllTags;
          const isCollapsible =
            tag.extensions?.["x-zudoku-collapsible"] ?? true;

          return createSidebarCategory({
            label: tag.name,
            path: categoryPath,
            operations: tag.operations,
            collapsed: isCollapsed,
            collapsible: isCollapsible,
          });
        });

        const untaggedOperations = data.schema.tags.find(
          (tag) => !tag.name,
        )?.operations;

        if (untaggedOperations) {
          categories.push(
            createSidebarCategory({
              label: "Other endpoints",
              path: joinUrl(basePath, versionParam, UNTAGGED_PATH),
              operations: untaggedOperations,
              collapsed: !config.options?.expandAllTags,
            }),
          );
        }

        if (data.schema.components?.schemas?.length) {
          categories.push({
            type: "link" as const,
            label: "Schemas",
            href: joinUrl(basePath, versionParam, "~schemas"),
          });
        }

        return categories;
      } catch {
        return [];
      }
    },
    getRoutes: () => getRoutes({ basePath, config, client }),
  };
};
