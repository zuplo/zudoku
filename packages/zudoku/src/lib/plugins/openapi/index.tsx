import { matchPath, useRouteError, type RouteObject } from "react-router-dom";
import { Client as UrqlClient, cacheExchange, fetchExchange } from "urql";
import { type DevPortalPlugin } from "../../core/plugins.js";
import { graphql } from "./graphql/index.js";

import { useQuery } from "@tanstack/react-query";
import { CirclePlayIcon, LogInIcon } from "lucide-react";
import { createClient } from "zudoku/openapi-worker";
import type { SidebarItem } from "../../../config/validators/SidebarSchema.js";
import { useAuth } from "../../authentication/hook.js";
import { ErrorPage } from "../../components/ErrorPage.js";
import { ColorMap } from "../../components/navigation/SidebarBadge.js";
import { SyntaxHighlight } from "../../components/SyntaxHighlight.js";
import { Button } from "../../ui/Button.js";
import { joinPath } from "../../util/joinPath.js";
import { OasPluginConfig } from "./interfaces.js";
import type { PlaygroundContentProps } from "./playground/Playground.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";
import { GetServerQuery } from "./Sidecar.js";

const GetCategoriesQuery = graphql(`
  query GetCategories($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
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

const OpenApiErrorPage = () => {
  const error = useRouteError();
  const message =
    error instanceof Error ? (
      <SyntaxHighlight code={error.message} />
    ) : (
      "An unknown error occurred"
    );

  return (
    <ErrorPage category="Error" title="An error occurred" message={message} />
  );
};

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

export const openApiPlugin = (
  config: OpenApiPluginOptions,
): DevPortalPlugin => {
  const basePath = joinPath(config.navigationId ?? "/reference");

  const client = config.server
    ? new UrqlClient({
        url: config.server,
        exchanges: [cacheExchange, fetchExchange],
      })
    : createClient({ useMemoryClient: config.inMemory ?? false });

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
        const serverQuery = useQuery({
          queryFn: async () => {
            const result = await client.query(GetServerQuery, {
              type: config.type,
              input: config.input,
            });

            return result.data;
          },
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

      const { data } = await client.query(GetCategoriesQuery, {
        input: config.input,
        type: config.type,
      });

      if (!data) return [];

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
              color: MethodColorMap[operation.method.toLowerCase()],
            },
          })),
        }));

      categories.unshift({
        type: "link",
        label: "Overview",
        href: "#description",
      });

      return categories;
    },
    getRoutes: () =>
      [
        {
          async lazy() {
            const { OpenApiRoute } = await import("./Route.js");
            return {
              element: <OpenApiRoute client={client} config={config} />,
            };
          },
          errorElement: <OpenApiErrorPage />,
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
