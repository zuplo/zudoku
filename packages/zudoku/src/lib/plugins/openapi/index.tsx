import { CirclePlayIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { matchPath } from "react-router";
import type { NavigationItem } from "../../../config/validators/NavigationSchema.js";
import { IdentityContextProvider } from "../../components/context/IdentityContext.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import type { ApiIdentity } from "../../core/ZudokuContext.js";
import { Button } from "../../ui/Button.js";
import { joinUrl } from "../../util/joinUrl.js";
import { GraphQLClient } from "./client/GraphQLClient.js";
import { createQuery } from "./client/useCreateQuery.js";
import type { GetNavigationOperationsQuery as GetNavigationOperationsQueryResult } from "./graphql/graphql.js";
import { graphql } from "./graphql/index.js";
import type { OasPluginConfig } from "./interfaces.js";
import type { PlaygroundContentProps } from "./playground/Playground.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";
import { createNavigationCategory } from "./util/createNavigationCategory.js";
import { getRoutes, getVersionMetadata } from "./util/getRoutes.js";

export const GetSecuritySchemesQuery = graphql(`
  query GetSecuritySchemes($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      security {
        name
        scopes
      }
      components {
        securitySchemes {
          name
          type
          description
        }
      }    
    }
  }
`);

export const GetNavigationOperationsQuery = graphql(`
  query GetNavigationOperations($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      extensions
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
  GetNavigationOperationsQueryResult["schema"]["tags"][number]["operations"][number];

export type OpenApiPluginOptions = OasPluginConfig;

export const UNTAGGED_PATH = "~endpoints";

export const openApiPlugin = (config: OasPluginConfig): ZudokuPlugin => {
  const basePath = joinUrl(config.path);
  const client = new GraphQLClient(config);
  const uuid = crypto.randomUUID();
  return {
    getIdentities: async (context, identityContext) => {
      // Only return identities for this plugin
      if (identityContext.pluginId !== uuid) {
        return [];
      }

      const { versions } = getVersionMetadata(config);
      const version = versions.at(0);
      const input = Array.isArray(config.input)
        ? (config.input.find((v) => v.path === version)?.input ??
          config.input[0]?.input)
        : config.input;

      const query = createQuery(client, GetSecuritySchemesQuery, {
        type: config.type,
        input,
      });
      const data = await context.queryClient.ensureQueryData(query);

      return (
        data.schema.security?.flatMap((security) => {
          const scheme = data.schema.components?.securitySchemes?.find(
            (scheme) => scheme.name === security.name,
          );
          if (!scheme) {
            return [];
          }

          return {
            label: security.name,
            securityScheme: scheme,
            id: security.name,
            authorizeRequest: async (request) => {
              // const header = request.headers.get(scheme.parameterName);
              // if (!header) {
              //   return request;
              // }
              return request;
            },
            authorizationFields: {
              headers: ["X-API-Key"],
            },
          } satisfies ApiIdentity;
        }) ?? []
      );
    },
    getHead: () => {
      if (config.type === "url" && !config.skipPreload) {
        const urls = Array.isArray(config.input)
          ? config.input.map((v) => v.input)
          : [config.input];

        return urls.map((url) => (
          <link
            key={url}
            href={url}
            rel="preload"
            as="fetch"
            crossOrigin="anonymous"
          />
        ));
      }

      if (config.server) {
        return <link rel="preconnect" href={config.server} />;
      }
    },
    getMdxComponents: () => ({
      OpenPlaygroundButton: ({
        server,
        method = "get",
        url = "/",
        children,
        ...props
      }: PropsWithChildren<Partial<PlaygroundContentProps>>) => {
        if (!server) {
          throw new Error("Server is required");
        }

        return (
          <PlaygroundDialog
            url={url}
            method={method}
            server={server}
            {...props}
          >
            <Button className="gap-2 items-center" variant="outline">
              {children ?? (
                <>
                  Open in Playground
                  <CirclePlayIcon size={16} />
                </>
              )}
            </Button>
          </PlaygroundDialog>
        );
      },
    }),
    getNavigation: async (path, context) => {
      if (!matchPath({ path: basePath, end: false }, path)) {
        return [];
      }

      const match = matchPath(
        { path: `${basePath}/:version?/:tag`, end: true },
        path,
      );

      try {
        const versionParam = match?.params.version;
        const { versions } = getVersionMetadata(config);
        const version = versionParam ?? versions.at(0);
        const { type } = config;

        const input = Array.isArray(config.input)
          ? (config.input.find((v) => v.path === version)?.input ??
            config.input[0]?.input)
          : config.input;

        const query = createQuery(client, GetNavigationOperationsQuery, {
          type,
          input,
        });
        const data = await context.queryClient.ensureQueryData(query);

        const tagCategories = new Map(
          data.schema.tags
            .filter((tag) => tag.name && tag.operations.length > 0)
            .map((tag) => {
              if (!tag.name) {
                throw new Error(`Tag ${tag.slug} has no name`);
              }

              const categoryPath = joinUrl(basePath, versionParam, tag.slug);

              const isCollapsed =
                tag.extensions?.["x-zudoku-collapsed"] ??
                !config.options?.expandAllTags;
              const isCollapsible =
                tag.extensions?.["x-zudoku-collapsible"] ?? true;

              return [
                tag.name,
                createNavigationCategory({
                  label: tag.extensions?.["x-displayName"] ?? tag.name,
                  path: categoryPath,
                  operations: tag.operations,
                  collapsed: isCollapsed,
                  collapsible: isCollapsible,
                }),
              ];
            }),
        );

        const tagGroups =
          (data.schema.extensions?.["x-tagGroups"] as
            | { name: string; tags: string[] }[]
            | undefined) ?? [];

        const groupedTags = new Set(
          tagGroups.flatMap((group) =>
            group.tags.filter((name) => tagCategories.has(name)),
          ),
        );

        const groupedCategories: NavigationItem[] = tagGroups.flatMap(
          (group) => {
            const items = group.tags
              .map((name) => tagCategories.get(name))
              .filter(Boolean) as NavigationItem[];

            if (items.length === 0) {
              return [];
            }
            return [
              {
                type: "category",
                label: group.name,
                items,
                collapsible: true,
                collapsed: !config.options?.expandAllTags,
              },
            ];
          },
        );

        const categories: NavigationItem[] = [
          ...groupedCategories,
          ...Array.from(tagCategories.entries())
            .filter(([name]) => !groupedTags.has(name))
            .map(([, cat]) => cat),
        ];

        const untaggedOperations = data.schema.tags.find(
          (tag) => !tag.name,
        )?.operations;

        if (untaggedOperations && untaggedOperations.length > 0) {
          categories.push(
            createNavigationCategory({
              label: categories.length === 0 ? "Endpoints" : "Other endpoints",
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
            to: joinUrl(basePath, versionParam, "~schemas"),
          });
        }

        return categories;
      } catch {
        return [];
      }
    },
    getRoutes: () => [
      {
        element: <IdentityContextProvider value={{ pluginId: uuid }} />,
        children: getRoutes({ basePath, config, client }),
      },
    ],
  };
};
