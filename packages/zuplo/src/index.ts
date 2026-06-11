// In client/server bundles the companion Vite plugin replaces this node-only
// module with an empty stub; there the baked virtual context is used instead.
import { getProcessors, inspectZuploContext } from "@zuplo/zudoku/node";
import { zuploContext } from "virtual:zuplo-context";
import { createPlugin, type ZudokuConfig } from "zudoku";
import { selectPluginConfigs } from "zudoku/plugins";
import { applyZuploConfig } from "./apply-config.js";
import type { ZuploPluginOptions } from "./options.js";

/**
 * Builds the Zudoku config for the Zuplo project the docs live in:
 *
 * - Sets up an OpenAPI reference for each OpenAPI file in the project's
 *   `config/` directory.
 * - Sets up a GraphQL reference for each GraphQL endpoint in the project's
 *   routes (operations marked with `x-graphql`).
 * - Applies the Zuplo-specific OpenAPI processors: enriches operations from
 *   the project's policies (API key headers, rate limit responses), documents
 *   MCP server routes, injects the gateway server URL and strips internal
 *   routes, parameters and `x-zuplo` extensions.
 */
export const zuploPlugin = createPlugin(
  "zuplo",
  (options: ZuploPluginOptions = {}) => ({
    transformConfig: async ({ config }) => {
      // In the client/server bundles the context is baked in by the companion
      // Vite plugin (vite.config.ts at the package root, merged automatically)
      if (zuploContext) {
        return applyZuploConfig(config, zuploContext, options).config;
      }

      // During config loading the virtual module is stubbed, so inspect the
      // Zuplo project directly and contribute the schema processors
      const rootDir =
        (config as { __meta?: { rootDir?: string } }).__meta?.rootDir ??
        process.cwd();
      const context = await inspectZuploContext({ rootDir });
      const { config: transformed, graphqlRoutePaths } = applyZuploConfig(
        config,
        context,
        options,
      );

      return {
        ...transformed,
        __processors: [
          ...(transformed.__processors ?? []),
          ...(await getProcessors({ rootDir, graphqlRoutePaths })),
        ],
      };
    },
  }),
);

/**
 * Adds the Zuplo plugin to a config unless one is already configured.
 *
 * Zudoku applies this automatically when running in Zuplo mode, so the config
 * is built on the fly without any setup. Add `zuploPlugin()` to the config's
 * `plugins` yourself only to pass options.
 */
export const withZuploPlugin = <T extends ZudokuConfig>(config: T): T =>
  selectPluginConfigs(config.plugins ?? [], "zuplo").length > 0
    ? config
    : { ...config, plugins: [...(config.plugins ?? []), zuploPlugin()] };

export type { ZuploPluginOptions } from "./options.js";
export type {
  ZuploContext,
  ZuploGraphQLEndpoint,
  ZuploOpenApiFile,
} from "./context/types.js";
