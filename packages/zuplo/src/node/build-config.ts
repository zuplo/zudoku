import type { ZudokuConfig } from "zudoku";
import type { Processor } from "zudoku/vite";
import { getProcessors } from "./processors/index.js";

type ConfigInternals = {
  __meta?: { rootDir: string };
  __processors?: Processor[];
};

export type ApplyZuploProcessorsOptions = {
  /** The dev portal root directory. Defaults to the config's own root directory. */
  rootDir?: string;
};

/**
 * Attaches the Zuplo build-time OpenAPI schema processors to a loaded config:
 * API key and rate limit policy documentation, MCP server documentation,
 * gateway server URL injection and `x-zuplo-*` extension removal.
 *
 * Node-only: processors are functions over the local Zuplo project, so unlike
 * the static configuration (which `zudoku generate` compiles from the spec
 * into the base config layer) they are attached at config load time. Zudoku
 * applies this automatically in Zuplo mode (`--zuplo`).
 */
export const applyZuploProcessors = async <
  T extends ZudokuConfig & ConfigInternals,
>(
  config: T,
  options: ApplyZuploProcessorsOptions = {},
): Promise<T> => {
  const rootDir = options.rootDir ?? config.__meta?.rootDir ?? process.cwd();
  const processors = await getProcessors({ rootDir });

  return {
    ...config,
    __processors: [...(config.__processors ?? []), ...processors],
  };
};
