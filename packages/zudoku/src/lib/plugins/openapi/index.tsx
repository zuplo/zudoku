import { matchPath } from "react-router";
import { type ZudokuPlugin } from "../../core/plugins.js";
import { graphql } from "./graphql/index.js";

import { useQuery } from "@tanstack/react-query";
import { CirclePlayIcon, LogInIcon } from "lucide-react";
import type { SidebarItem } from "../../../config/validators/SidebarSchema.js";
import { useAuth } from "../../authentication/hook.js";
import { ColorMap } from "../../components/navigation/SidebarBadge.js";
import type { SchemaImports } from "../../oas/graphql/index.js";
import { Button } from "../../ui/Button.js";
import { joinPath } from "../../util/joinPath.js";
import { GraphQLClient } from "./client/GraphQLClient.js";
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

type InternalOasPluginConfig = { schemaImports?: SchemaImports };

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

  const versions = config.type === "file" ? Object.keys(config.input) : [];

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
        const version =
          versions.find((v) => path === joinPath(basePath, v)) ??
          Object.keys(config.input).at(0);

        const data = await client.fetch(GetCategoriesQuery, {
          type: config.type,
          input: config.type === "file" ? config.input[version!] : config.input,
          version,
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
                invert: true,
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
    getRoutes: () => {
      const versionsInPath = [null, ...versions];

      return versionsInPath.map((version) => ({
        path: basePath + (version ? `/${version}` : ""),
        async lazy() {
          const { OpenApiRoute } = await import("./Route.js");
          return {
            element: (
              <OpenApiRoute
                basePath={basePath}
                versions={versions}
                client={client}
                config={config}
              />
            ),
          };
        },
        children: [
          {
            index: true,
            async lazy() {
              const { OperationList } = await import("./OperationList.js");
              return { element: <OperationList /> };
            },
          },
        ],
      }));
    },
  };
};
