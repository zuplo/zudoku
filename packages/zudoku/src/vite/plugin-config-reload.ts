import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";
import { getConfigFilePath, type LoadedConfig } from "./config.js";

export const createConfigReloadPlugin = (
  initialConfig: ZudokuPluginOptions,
  onConfigChange?: () => Promise<LoadedConfig>,
): [Plugin, () => ZudokuPluginOptions] => {
  let currentConfig = initialConfig;

  const plugin = {
    name: "zudoku-config-reload",
    configureServer: ({ watcher, restart }) => {
      if (!onConfigChange) return;

      watcher.on("change", async (file) => {
        const configFilePath = await getConfigFilePath(currentConfig.rootDir);

        if (file !== configFilePath) return;

        const newConfig = await onConfigChange();
        currentConfig = { ...initialConfig, ...newConfig };
        await restart();
      });
    },
  } satisfies Plugin;

  return [plugin, () => currentConfig] as const;
};
