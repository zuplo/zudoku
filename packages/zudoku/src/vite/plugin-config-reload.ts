import path from "node:path";
import { type Plugin } from "vite";
import { printDiagnosticsToConsole } from "../cli/common/output.js";
import { LoadedConfig, type ZudokuPluginOptions } from "../config/config.js";

export const createConfigReloadPlugin = (
  initialConfig: ZudokuPluginOptions,
  onConfigChange?: () => Promise<LoadedConfig>,
): [Plugin, () => ZudokuPluginOptions] => {
  let currentConfig = initialConfig;
  let importDependencies = initialConfig.__meta.dependencies;

  const plugin: Plugin = {
    name: "zudoku-config-reload",
    configureServer: ({ watcher, restart, ws }) => {
      if (!onConfigChange) return;

      watcher.on("change", async (file) => {
        if (!importDependencies.includes(file)) return;

        const newConfig = await onConfigChange();
        currentConfig = { ...initialConfig, ...newConfig };

        importDependencies = newConfig.__meta.dependencies;

        // Assume `.tsx` files are handled by HMR (skip if the config file itself changed)
        if (file !== newConfig.__meta.path && file.endsWith(".tsx")) return;

        await ws.close();
        await restart();
        printDiagnosticsToConsole(
          `[${new Date().toLocaleTimeString()}]: Config ${path.basename(currentConfig.__meta.path)} changed. Restarted server.`,
        );
      });
    },
  };

  return [plugin, () => currentConfig] as const;
};
