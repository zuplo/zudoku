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
  query GetOperations($input: JSON!, $type: SchemaType!, $tag: String) {
    schema(input: $input, type: $type) {
      operations(tag: $tag) {
        slug
        deprecated
        method
        summary
        operationId
        path
        tags {
          name
        }
      }
      untagged: operations(untagged: true) {
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

        const tagData = await client.fetch(GetCategoriesQuery, {
          type: config.type,
          input: config.type === "file" ? config.input[version!] : config.input,
        });

        const tag = config.tagPages?.find(
          (tag) => path.split("/").at(-1) === slugify(tag),
        );

        const operationsData = await client.fetch(GetOperationsQuery, {
          type: config.type,
          input: config.type === "file" ? config.input[version!] : config.input,
          tag: !config.loadTags ? tag : undefined,
        });

        const collapsible = config.loadTags || config.type === "url";
        const collapsed = !config.loadTags && config.type !== "url";

        const categories = tagData.schema.tags.flatMap<SidebarItem>((tag) => {
          const categoryLink = joinUrl(basePath, urlVersion, slugify(tag.name));

          const operations = operationsData.schema.operations
            .filter(
              (operation) =>
                operation.tags?.length !== 0 &&
                operation.tags?.map((t) => t.name).includes(tag.name),
            )
            .map((operation) => ({
              type: "link" as const,
              label: operation.summary ?? operation.path,
              href: `${categoryLink}#${operation.slug}`,
              badge: {
                label: operation.method,
                color: MethodColorMap[operation.method.toLowerCase()]!,
                invert: true,
              } as const,
            }));

          if (config.loadTags && operations.length === 0) {
            return [];
          }

          return {
            type: "category",
            label: tag.name,
            link: {
              type: "doc" as const,
              id: categoryLink,
              label: tag.name,
            },
            collapsible,
            collapsed,
            items: operations,
          };
        });

        const { untagged } = operationsData.schema;

        if (untagged.length > 0) {
          const categoryLink = joinUrl(basePath, urlVersion, UNTAGGED_PATH);

          categories.push({
            type: "category",
            label: "Other endpoints",
            link: {
              type: "doc" as const,
              id: categoryLink,
              label: "Other endpoints",
            },
            collapsible,
            collapsed,
            items: untagged.map((operation) => ({
              type: "link" as const,
              label: operation.summary ?? operation.path,
              href: `${categoryLink}#${operation.slug}`,
            })),
          });
        }

        return categories;
      } catch {
        return [];
      }
    },
    getRoutes: () => {
      const versionsInPath = versions.length > 1 ? [null, ...versions] : [null];

      const tagPages = config.tagPages?.map((tag) => ({
        tag,
        path: slugify(tag),
      }));

      return versionsInPath.map((version) => {
        const versionPath = joinUrl(basePath, version);

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
            tagPages
              ? {
                  index: true,
                  loader: () =>
                    redirect(
                      joinUrl(
                        versionPath,
                        tagPages.at(0)?.path ?? UNTAGGED_PATH,
                      ),
                    ),
                }
              : {
                  // Schemas that can't provide all tags upfront as build time schemas do are caught here
                  path: versionPath + "/:tag?",
                  async lazy() {
                    const { OperationList } = await import(
                      "./OperationList.js"
                    );
                    return { element: <OperationList untagged={false} /> };
                  },
                },
            ...(tagPages ?? []).map<RouteObject>((tag) => ({
              path: joinUrl(versionPath, tag.path),
              async lazy() {
                const { OperationList } = await import("./OperationList.js");
                return { element: <OperationList tag={tag.tag} /> };
              },
            })),
            {
              path: joinUrl(versionPath, UNTAGGED_PATH),
              async lazy() {
                const { OperationList } = await import("./OperationList.js");
                return { element: <OperationList untagged={true} /> };
              },
            },
          ],
        };
      });
    },
  };
};
