// Tags a plugin's config under a symbol so its companion Vite plugin can read it
// back by name (`getPluginConfigs`) for build-time preprocessing.
const PLUGIN_CONFIG = Symbol.for("zudoku.pluginConfig");

type PluginConfigCarrier = {
  [PLUGIN_CONFIG]?: { name: string; config: unknown };
};

export const tagPluginConfig = <T extends object>(
  plugin: T,
  name: string,
  config: unknown,
): T => ({ ...plugin, [PLUGIN_CONFIG]: { name, config } });

export const selectPluginConfigs = <V>(
  plugins: readonly unknown[],
  name: string,
): V[] =>
  plugins.flatMap((plugin) => {
    const tag =
      plugin && typeof plugin === "object"
        ? (plugin as PluginConfigCarrier)[PLUGIN_CONFIG]
        : undefined;
    return tag?.name === name ? [tag.config as V] : [];
  });
