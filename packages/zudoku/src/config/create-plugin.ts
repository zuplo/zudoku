import {
  isTransformConfigPlugin,
  type TransformConfigPlugin,
  type ZudokuPlugin,
} from "../lib/core/plugins.js";
import type { ZudokuConfig } from "./validators/validate.js";

// Regex from stacktrace-parser for Node.js stack traces
// https://github.com/errwischt/stacktrace-parser
const NODE_STACK_REGEX =
  /^\s*at (?:(?:\[object object\])?[^\\/]+(?: \[as \S+\])? )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;

const getCallerDir = () => {
  const stack = new Error().stack;
  if (!stack) return undefined;

  // Stack frames: Error, getCallerDir, createPlugin, <caller>
  const lines = stack.split("\n");
  const callerLine = lines[3];
  if (!callerLine) return undefined;

  const match = callerLine.match(NODE_STACK_REGEX);
  let filePath = match?.[1];
  if (!filePath) return undefined;

  if (filePath.startsWith("file://")) {
    filePath = filePath.slice(7);
  }

  // Handle both forward and backslashes for cross-platform support
  const lastSlash = Math.max(
    filePath.lastIndexOf("/"),
    filePath.lastIndexOf("\\"),
  );
  if (lastSlash === -1) return undefined;

  return filePath.substring(0, lastSlash);
};

export const createPlugin = <
  TOptions extends unknown[],
  TPlugin extends ZudokuPlugin,
>(
  factory: (...options: TOptions) => TPlugin,
): ((...options: TOptions) => TPlugin & TransformConfigPlugin) => {
  const pluginDir = getCallerDir();

  return (...options: TOptions) => {
    const plugin = factory(...options);

    if (!pluginDir) {
      return plugin as TPlugin & TransformConfigPlugin;
    }

    const originalTransformConfig = isTransformConfigPlugin(plugin)
      ? plugin.transformConfig
      : undefined;

    return {
      ...plugin,
      transformConfig: async (config) => {
        const result = (await originalTransformConfig?.(config)) ?? {};

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
