import type { ResultOf } from "@graphql-typed-document-node/core";
import slugify from "@sindresorhus/slugify";
import { CirclePlayIcon, LogInIcon } from "lucide-react";
import { matchPath } from "react-router";
import { useAuth } from "../../authentication/hook.js";
import { type ZudokuPlugin } from "../../core/plugins.js";
import type { SchemaImports } from "../../oas/graphql/index.js";
import { Button } from "../../ui/Button.js";
import { joinUrl } from "../../util/joinUrl.js";
import { GraphQLClient } from "./client/GraphQLClient.js";
import { graphql } from "./graphql/index.js";
import { OasPluginConfig } from "./interfaces.js";
import type { PlaygroundContentProps } from "./playground/Playground.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";
import { createSidebarCategory } from "./util/createSidebarCategory.js";
import { getRoutes, getVersions } from "./util/getRoutes.js";

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

export type OperationResult = ResultOf<
  typeof GetOperationsQuery
>["schema"]["operations"][number];

type InternalOasPluginConfig = { schemaImports?: SchemaImports };

export type OpenApiPluginOptions = OasPluginConfig & InternalOasPluginConfig;

export const UNTAGGED_PATH = "~endpoints";

export const openApiPlugin = (config: OpenApiPluginOptions): ZudokuPlugin => {
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

      const match = matchPath(
        { path: `${basePath}/:version?/:tag`, end: true },
        path,
      );

      try {
        const versionParam = match?.params.version;
        const version = versionParam ?? getVersions(config).at(0);
        const type = config.type;
        const input =
          config.type === "file" ? config.input[version!] : config.input;

        const collapsible = config.loadTags === true || config.type === "url";
        const collapsed = !config.loadTags && config.type !== "url";

        // find  tag name by slug in config.tagPages
        const tagName = config.tagPages?.find(
          (tag) => slugify(tag) === match?.params.tag,
        );

        const [tagData, operationsData] = await Promise.all([
          client.fetch(GetCategoriesQuery, { type, input }),
          client.fetch(GetOperationsQuery, {
            type,
            input,
            tag: !config.loadTags ? tagName : undefined,
          }),
        ]);

        const categories = tagData.schema.tags.flatMap((tag) => {
          const categoryPath = joinUrl(
            basePath,
            versionParam,
            slugify(tag.name),
          );

          const operations = operationsData.schema.operations.filter(
            (operation) =>
              operation.tags?.length !== 0 &&
              operation.tags?.map((t) => t.name).includes(tag.name),
          );

          // skip empty categories
          if (config.loadTags && operations.length === 0) {
            return [];
          }

          return createSidebarCategory({
            label: tag.name,
            path: categoryPath,
            operations:
              match?.params.tag !== UNTAGGED_PATH || config.loadTags
                ? operations
                : [],
            collapsible,
            collapsed,
          });
        });

        if (operationsData.schema.untagged.length > 0) {
          categories.push(
            createSidebarCategory({
              label: "Other endpoints",
              path: joinUrl(basePath, versionParam, UNTAGGED_PATH),
              operations:
                match?.params.tag === UNTAGGED_PATH || config.loadTags
                  ? operationsData.schema.untagged
                  : [],
              collapsible,
              collapsed,
            }),
          );
        }

        return categories;
      } catch {
        return [];
      }
    },
    getRoutes: () => getRoutes({ basePath, config, client }),
  };
};
