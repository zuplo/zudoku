import type { ZudokuPlugin } from "../../core/plugins.js";
import { joinUrl } from "../../util/joinUrl.js";
import { GraphQLClient } from "./client/GraphQLClient.js";
import type { AsyncApiPluginConfig } from "./interfaces.js";

export type AsyncApiPluginOptions = AsyncApiPluginConfig;

export const UNTAGGED_PATH = "~operations";

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
    getNavigation: async () => {
      // Placeholder - will be fully implemented in Phase 3
      // For now, return empty navigation
      return [];
    },
    getRoutes: () => {
      // Placeholder - will be fully implemented in Phase 3
      // For now, return empty routes
      return [];
    },
  };
};
