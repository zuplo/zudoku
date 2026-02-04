import { matchPath } from "react-router";
import type { NavigationItem } from "../../../config/validators/NavigationSchema.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import { joinUrl } from "../../util/joinUrl.js";
import { GraphQLClient } from "./client/GraphQLClient.js";
import { createQuery } from "./client/useCreateQuery.js";
import {
  AsyncApiSchemaQuery,
  NavigationQuery,
  type NavigationQueryResult,
  type OperationResult,
} from "./graphql/queries.js";
import type { AsyncApiPluginConfig } from "./interfaces.js";
import { createNavigationCategory } from "./util/createNavigationCategory.js";
import { getRoutes, UNTAGGED_PATH } from "./util/getRoutes.js";

export type AsyncApiPluginOptions = AsyncApiPluginConfig & {
  tagPages?: string[];
};

export { AsyncApiSchemaQuery, UNTAGGED_PATH };
export type { OperationResult };

/**
 * AsyncAPI Plugin for Zudoku
 *
 * Provides support for AsyncAPI 3.0 specifications to document
 * event-driven APIs (WebSocket, MQTT, Kafka, AMQP, etc.)
 */
export const asyncApiPlugin = (config: AsyncApiPluginConfig): ZudokuPlugin => {
  const basePath = joinUrl(config.path);
  const client = new GraphQLClient(config);

  return {
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
      // Placeholder for AsyncPlaygroundButton - will be implemented in Phase 4
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

        const query = createQuery(client, NavigationQuery);
        const data = (await context.queryClient.ensureQueryData(
          query,
        )) as NavigationQueryResult;

        // Create navigation categories for each tag (following OpenAPI pattern)
        const categories: NavigationItem[] = data.schema.tags
          .filter((tag) => tag.name && tag.operations.length > 0)
          .map((tag) => {
            if (!tag.name) {
              throw new Error(`Tag ${tag.slug} has no name`);
            }

            const categoryPath = joinUrl(basePath, versionParam, tag.slug);

            return createNavigationCategory({
              label: tag.name,
              path: categoryPath,
              operations: tag.operations,
              collapsible: true,
              collapsed: !config.options?.expandAllTags,
            });
          });

        // Find untagged operations (operations that don't appear in any tag)
        const untaggedOps = data.schema.tags.find(
          (tag) => !tag.name,
        )?.operations;

        if (untaggedOps && untaggedOps.length > 0) {
          categories.push(
            createNavigationCategory({
              label: categories.length === 0 ? "Endpoints" : "Other endpoints",
              path: joinUrl(basePath, versionParam, UNTAGGED_PATH),
              operations: untaggedOps,
              collapsible: true,
              collapsed: !config.options?.expandAllTags,
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
