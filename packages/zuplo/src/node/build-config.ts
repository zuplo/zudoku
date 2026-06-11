import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ZudokuConfig } from "zudoku";
import type { Processor } from "zudoku/vite";
import { applyZuploContext } from "../index.js";
import { inspectZuploContext } from "./inspect.js";
import { getProcessors } from "./processors/index.js";

const packageDir = path.dirname(fileURLToPath(import.meta.url));

type ConfigInternals = {
  __meta?: { rootDir: string };
  __processors?: Processor[];
  __pluginDirs?: string[];
  __zuplo?: unknown;
};

export type BuildZuploConfigOptions = {
  /** The dev portal root directory. Defaults to the config's own root directory. */
  rootDir?: string;
};

/**
 * Inspects the surrounding Zuplo project and builds the Zudoku config for it:
 * an OpenAPI (`apis`) entry per detected OpenAPI file, a GraphQL plugin per
 * detected GraphQL endpoint, and the Zuplo schema processors (API key and rate
 * limit policy documentation, MCP server documentation, gateway server URL
 * injection and `x-zuplo-*` extension removal).
 *
 * Node-only. Zudoku applies this automatically in Zuplo mode (`--zuplo`); the
 * inspected context is stored on the config (`__zuplo`) so the client bundle
 * can apply the identical enrichment via `applyZuploContext`.
 */
export const buildZuploConfig = async <
  T extends ZudokuConfig & ConfigInternals,
>(
  config: T,
  options: BuildZuploConfigOptions = {},
): Promise<T> => {
  if (config.__zuplo) return config;

  const rootDir = options.rootDir ?? config.__meta?.rootDir ?? process.cwd();

  const context = await inspectZuploContext({ rootDir, config });
  const processors = await getProcessors({
    rootDir,
    stripGraphQLRoutes: context.graphql.length > 0,
  });

  return {
    ...applyZuploContext(config, context),
    __processors: [...(config.__processors ?? []), ...processors],
    __pluginDirs: [...(config.__pluginDirs ?? []), packageDir],
    __zuplo: context,
  };
};
