import path from "node:path";
import colors from "picocolors";
import { type Plugin, type ViteDevServer } from "vite";
import { logger } from "../cli/common/logger.js";
import { getCurrentConfig } from "../config/loader.js";

export const reload = ({ ws, environments }: ViteDevServer) => {
  Object.values(environments).forEach((environment) => {
    environment.moduleGraph.invalidateAll();
  });

  ws.send({ type: "full-reload" });
};

export const viteConfigReloadPlugin = (): Plugin => ({
  name: "zudoku-config-reload",
  configureServer: (server) => {
    const initialConfig = getCurrentConfig();
    let importDependencies = initialConfig.__meta.dependencies;
    server.watcher.on("change", async (file) => {
      if (
        !importDependencies.includes(file) &&
        file !== initialConfig.__meta.configPath
      ) {
        return;
      }

      const currentConfig = getCurrentConfig();
      importDependencies = currentConfig.__meta.dependencies;

      // Assume `.tsx` files are handled by HMR (skip if the config file itself changed)
      if (file !== currentConfig.__meta.configPath && file.endsWith(".tsx"))
        return;

      Object.values(server.environments).forEach((env) => {
        env.moduleGraph.invalidateAll();
      });

      logger.info(
        colors.blue(
          `Config ${path.basename(currentConfig.__meta.configPath)} changed. Reloading...`,
        ),
        { timestamp: true },
      );
    });
  },
});
