import path from "node:path";
import { type Plugin, type ViteDevServer } from "vite";
import { printDiagnosticsToConsole } from "../cli/common/output.js";
import { type LoadedConfig } from "../config/config.js";

export const reload = ({ ws, environments }: ViteDevServer) => {
  Object.values(environments).forEach((environment) => {
    environment.moduleGraph.invalidateAll();
  });

  ws.send({ type: "full-reload" });
};

export const createConfigReloadPlugin = (
  initialConfig: LoadedConfig,
  onConfigChange?: () => Promise<LoadedConfig>,
): [Plugin, () => LoadedConfig] => {
  let currentConfig = initialConfig;
  let importDependencies = initialConfig.__meta.dependencies;

  const plugin: Plugin = {
    name: "zudoku-config-reload",
    configureServer: (server) => {
      if (!onConfigChange) return;

      server.watcher.on("change", async (file) => {
        if (!importDependencies.includes(file)) return;

        const newConfig = await onConfigChange();
        currentConfig = { ...initialConfig, ...newConfig };

        importDependencies = newConfig.__meta.dependencies;

        // Assume `.tsx` files are handled by HMR (skip if the config file itself changed)
        if (file !== newConfig.__meta.configPath && file.endsWith(".tsx"))
          return;

        reload(server);

        printDiagnosticsToConsole(
          `[${new Date().toLocaleTimeString()}]: Config ${path.basename(currentConfig.__meta.configPath)} changed. Reloading...`,
        );
      });
    },
  };

  return [plugin, () => currentConfig] as const;
};
