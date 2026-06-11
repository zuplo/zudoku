import { graphqlPlugin } from "@zudoku/plugin-graphql";
import type { ZudokuConfig } from "zudoku";
import type { ZuploClientContext } from "./context.js";
import { ensureArray } from "./util/ensureArray.js";

/**
 * Applies an inspected Zuplo context to a Zudoku config: adds an OpenAPI
 * (`apis`) entry for every detected OpenAPI file and a GraphQL plugin instance
 * for every detected GraphQL endpoint.
 *
 * This function is environment-agnostic and deterministic: it runs node-side
 * during config loading and again in the client bundle (fed by the
 * `virtual:zudoku-zuplo-context` module), so both must produce the same
 * configuration.
 */
export const applyZuploContext = <T extends ZudokuConfig>(
  config: T,
  context: ZuploClientContext,
): T => {
  // Already enriched (e.g. by `buildZuploConfig` node-side)
  if ((config as { __zuplo?: unknown }).__zuplo) return config;

  const apis = [
    ...(config.apis ? ensureArray(config.apis) : []),
    ...context.apis,
  ];

  const plugins = [
    ...(config.plugins ?? []),
    ...context.graphql.map((graphql) => graphqlPlugin(graphql)),
  ];

  return {
    ...config,
    ...(apis.length > 0 ? { apis } : {}),
    plugins,
  };
};

export {
  EMPTY_ZUPLO_CONTEXT,
  VIRTUAL_ZUPLO_CONTEXT_ID,
  type ZuploApiEntry,
  type ZuploClientContext,
} from "./context.js";
