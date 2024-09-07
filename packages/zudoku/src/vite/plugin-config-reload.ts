import path from "node:path";
import { type Plugin } from "vite";
import { printDiagnosticsToConsole } from "../cli/common/output.js";
import { type ZudokuPluginOptions } from "../config/config.js";
import { type LoadedConfig } from "./config.js";

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
        if (!file.startsWith(currentConfig.rootDir)) return;

        const newConfig = await onConfigChange();
        currentConfig = { ...initialConfig, ...newConfig };

        if (!currentConfig.__meta.dependencies.includes(file)) return;

        await restart();
        printDiagnosticsToConsole(
          `[${new Date().toLocaleTimeString()}]: Config ${path.basename(currentConfig.__meta.path)} changed. Restarted server.`,
        );
      });
    },
  } satisfies Plugin;

  return [plugin, () => currentConfig] as const;
};
