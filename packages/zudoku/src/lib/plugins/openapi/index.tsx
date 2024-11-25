import { matchPath, type RouteObject } from "react-router-dom";
import { type ZudokuPlugin } from "../../core/plugins.js";
import { graphql } from "./graphql/index.js";

import { useQuery } from "@tanstack/react-query";
import { CirclePlayIcon, LogInIcon } from "lucide-react";
import { GraphQLClient } from "zudoku/openapi-worker";
import type { SidebarItem } from "../../../config/validators/SidebarSchema.js";
import { useAuth } from "../../authentication/hook.js";
import { ColorMap } from "../../components/navigation/SidebarBadge.js";
import { Button } from "../../ui/Button.js";
import { joinPath } from "../../util/joinPath.js";
import { OasPluginConfig } from "./interfaces.js";
import type { PlaygroundContentProps } from "./playground/Playground.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";

const GetCategoriesQuery = graphql(`
  query GetCategories($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      url
      tags {
        __typename
        name
        operations {
          __typename
          slug
          deprecated
          method
          summary
          operationId
          path
        }
      }
    }
  }
`);

type InternalOasPluginConfig = { inMemory?: boolean };

const MethodColorMap: Record<string, keyof typeof ColorMap> = {
  get: "green",
  post: "blue",
  put: "yellow",
  delete: "red",
  patch: "purple",
  options: "gray",
  head: "gray",
};

export type OpenApiPluginOptions = OasPluginConfig & InternalOasPluginConfig;

export const openApiPlugin = (config: OpenApiPluginOptions): ZudokuPlugin => {
  const basePath = joinPath(config.navigationId ?? "/reference");

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
        ...props
      }: Partial<PlaygroundContentProps> & { requireAuth: boolean }) => {
        const auth = useAuth();
        // We don't have the GraphQL context here
        const serverQuery = useQuery({
          queryFn: () =>
            client.fetch(GetCategoriesQuery, {
              type: config.type,
              input: config.input,
            }),
          enabled: !server,
          queryKey: ["playground-server"],
        });

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
            server={
              server ?? serverQuery.data?.schema.url ?? "https://example.com"
            }
            {...props}
          >
            <Button className="gap-2 items-center" variant="outline">
              Open in Playground <CirclePlayIcon size={16} />
            </Button>
          </PlaygroundDialog>
        );
      },
    }),
    getSidebar: async (path: string) => {
      if (!matchPath({ path: basePath, end: false }, path)) {
        return [];
      }

      try {
        const data = await client.fetch(GetCategoriesQuery, {
          type: config.type,
          input: config.input,
        });

        const categories = data.schema.tags
          .filter((tag) => tag.operations.length > 0)
          .map<SidebarItem>((tag) => ({
            type: "category",
            label: tag.name || "Other endpoints",
            collapsible: true,
            collapsed: false,
            items: tag.operations.map((operation) => ({
              type: "link",
              label: operation.summary ?? operation.path,
              href: `#${operation.slug}`,
              badge: {
                label: operation.method,
                color: MethodColorMap[operation.method.toLowerCase()]!,
              },
            })),
          }));

        categories.unshift({
          type: "link",
          label: "Overview",
          href: "#description",
        });

        return categories;
      } catch {
        return [];
      }
    },
    getRoutes: () =>
      [
        {
          async lazy() {
            const { OpenApiRoute } = await import("./Route.js");
            return { element: <OpenApiRoute config={config} /> };
          },
          children: [
            {
              path: basePath,
              children: [
                {
                  index: true,
                  async lazy() {
                    const { OperationList } = await import(
                      "./OperationList.js"
                    );
                    return { element: <OperationList /> };
                  },
                },
              ],
            },
          ],
        },
      ] satisfies RouteObject[],
  };
};
