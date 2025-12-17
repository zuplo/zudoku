import { tagPluginConfig } from "../lib/core/plugin-config.js";
import {
  isTransformConfigPlugin,
  type ZudokuPlugin,
} from "../lib/core/plugins.js";
import invariant from "../lib/util/invariant.js";

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

// Records the plugin's package dir so the build merges its `vite.config`.
const withPluginDir = (
  plugin: ZudokuPlugin,
  pluginDir: string,
): ZudokuPlugin => {
  const original = isTransformConfigPlugin(plugin)
    ? plugin.transformConfig
    : undefined;

  return {
    ...plugin,
    transformConfig: async (context) => {
      const result = (await original?.(context)) ?? context.config;
      return {
        ...result,
        __pluginDirs: [
          ...(context.config.__pluginDirs ?? []),
          ...(result.__pluginDirs ?? []),
          pluginDir,
        ],
      };
    },
  };
};

// Wraps a plugin factory: `name` exposes each instance's config to a companion
// Vite plugin via `getPluginConfigs(name)`; the caller dir is recorded for vite.config merge.
export function createPlugin<TOptions extends unknown[]>(
  factory: (...options: TOptions) => ZudokuPlugin,
): (...options: TOptions) => ZudokuPlugin;
export function createPlugin<TOptions extends unknown[]>(
  name: string,
  factory: (...options: TOptions) => ZudokuPlugin,
): (...options: TOptions) => ZudokuPlugin;
export function createPlugin<TOptions extends unknown[]>(
  nameOrFactory: string | ((...options: TOptions) => ZudokuPlugin),
  maybeFactory?: (...options: TOptions) => ZudokuPlugin,
): (...options: TOptions) => ZudokuPlugin {
  const name = typeof nameOrFactory === "string" ? nameOrFactory : undefined;
  const factory =
    typeof nameOrFactory === "string" ? maybeFactory : nameOrFactory;
  const pluginDir = getCallerDir();

  invariant(factory, "createPlugin requires a factory function");

  return (...options: TOptions) => {
    const plugin = factory(...options);
    const named = name ? tagPluginConfig(plugin, name, options[0]) : plugin;
    return pluginDir ? withPluginDir(named, pluginDir) : named;
  };
}
