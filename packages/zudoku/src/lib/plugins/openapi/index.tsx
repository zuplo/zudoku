import slugify from "@sindresorhus/slugify";
import { CirclePlayIcon, LogInIcon } from "lucide-react";
import { matchPath, redirect, RouteObject } from "react-router";
import type { SidebarItem } from "../../../config/validators/SidebarSchema.js";
import { useAuth } from "../../authentication/hook.js";
import { ColorMap } from "../../components/navigation/SidebarBadge.js";
import { type ZudokuPlugin } from "../../core/plugins.js";
import type { SchemaImports } from "../../oas/graphql/index.js";
import { Button } from "../../ui/Button.js";
import { joinUrl } from "../../util/joinUrl.js";
import { GraphQLClient } from "./client/GraphQLClient.js";
import { graphql } from "./graphql/index.js";
import { OasPluginConfig } from "./interfaces.js";
import type { PlaygroundContentProps } from "./playground/Playground.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";

const GetCategoriesQuery = graphql(`
  query GetCategories($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      url
      tags {
        name
      }
    }
  }
`);

const GetOperationsQuery = graphql(`
  query GetOperations(
    $input: JSON!
    $type: SchemaType!
    $tag: String
    $untagged: Boolean
  ) {
    schema(input: $input, type: $type) {
      operations(tag: $tag, untagged: $untagged) {
        slug
        deprecated
        method
        summary
        operationId
        path
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

const UNTAGGED_PATH = "~endpoints";

export const openApiPlugin = (config: OpenApiPluginOptions): ZudokuPlugin => {
  const basePath = joinUrl(config.navigationId ?? "/reference");
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
      }: Partial<PlaygroundContentProps> &
        Pick<PlaygroundContentProps, "server"> & {
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
        const urlVersion = versions.find((v) =>
          path.startsWith(joinUrl(basePath, v)),
        );
        const version = urlVersion ?? Object.keys(config.input).at(0);

        const data = await client.fetch(GetCategoriesQuery, {
          type: config.type,
          input: config.type === "file" ? config.input[version!] : config.input,
        });

        const tag = config.tagPages?.find(
          (tag) => path.split("/").at(-1) === slugify(tag),
        );

        const operationsData = await client.fetch(GetOperationsQuery, {
          type: config.type,
          input: config.type === "file" ? config.input[version!] : config.input,
          tag,
          untagged: tag === undefined,
        });

        const items = operationsData.schema.operations.map((operation) => ({
          type: "link" as const,
          label: operation.summary ?? operation.path,
          href: `#${operation.slug}`,
          badge: {
            label: operation.method,
            color: MethodColorMap[operation.method.toLowerCase()]!,
            invert: true,
          } as const,
        }));

        const categories = data.schema.tags
          // .filter((tag) => tag.operations.length > 0)
          .map<SidebarItem>((tag) => {
            const categoryLink = joinUrl(
              basePath,
              urlVersion,
              tag.name ? slugify(tag.name) : UNTAGGED_PATH,
            );
            return {
              type: "category",
              label: tag.name || "Other endpoints",
              link: {
                type: "doc" as const,
                id: categoryLink,
                label: tag.name!,
              },
              collapsible: false,
              collapsed: true,
              items: path === categoryLink ? items : [],
            };
          });

        return categories;
      } catch {
        return [];
      }
    },
    getRoutes: () => {
      const versionsInPath = [null, ...versions];

      const tagPages = (config.tagPages ?? []).map((tag) => ({
        tag,
        path: slugify(tag),
      }));

      return versionsInPath.map((version) => {
        const versionPath = joinUrl(basePath, version ? `/${version}` : "");

        return {
          path: versionPath,
          async lazy() {
            const { OpenApiRoute } = await import("./OpenApiRoute.js");
            return {
              element: (
                <OpenApiRoute
                  version={version ?? undefined}
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
              loader: () =>
                redirect(
                  joinUrl(versionPath, tagPages.at(0)?.path ?? UNTAGGED_PATH),
                ),
            },
            {
              path: joinUrl(versionPath, UNTAGGED_PATH),
              async lazy() {
                const { OperationList } = await import("./OperationList.js");
                return { element: <OperationList untagged={true} /> };
              },
            },
            ...tagPages.map<RouteObject>((tag) => {
              return {
                path: joinUrl(versionPath, tag.path),
                async lazy() {
                  const { OperationList } = await import("./OperationList.js");
                  return {
                    element: <OperationList tag={tag.tag} />,
                  };
                },
              };
            }),
          ],
        };
      });
    },
  };
};
