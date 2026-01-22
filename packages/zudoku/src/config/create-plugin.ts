import {
  isTransformConfigPlugin,
  type TransformConfigPlugin,
  type ZudokuPlugin,
} from "../lib/core/plugins.js";
import type { ZudokuConfig } from "./validators/validate.js";

export const createPlugin = <TOptions, TPlugin extends ZudokuPlugin>(
  factory: (options: TOptions) => TPlugin,
  importMetaUrl?: string,
): ((options: TOptions) => TPlugin & TransformConfigPlugin) => {
  return (options: TOptions) => {
    const plugin = factory(options);

    if (!importMetaUrl) {
      return plugin as TPlugin & TransformConfigPlugin;
    }

    const originalTransformConfig = isTransformConfigPlugin(plugin)
      ? plugin.transformConfig
      : undefined;

    return {
      ...plugin,
      transformConfig: async (config, ctx) => {
        const { dirname } = await import("node:path");
        const { fileURLToPath } = await import("node:url");
        const pluginDir = dirname(fileURLToPath(importMetaUrl));
        const result = (await originalTransformConfig?.(config, ctx)) ?? {};

        return {
          ...result,
          __tailwindSources: [
            ...(config.__tailwindSources ?? []),
            ...(result.__tailwindSources ?? []),
            pluginDir,
          ],
        } as Partial<ZudokuConfig>;
      },
    } as TPlugin & TransformConfigPlugin;
  };
};
