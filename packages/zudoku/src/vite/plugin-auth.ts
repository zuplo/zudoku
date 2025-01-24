import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";

const viteAuthPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  const virtualModuleId = "virtual:zudoku-auth";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "zudoku-auth-plugin", // required, will show up in warnings and errors
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const config = getConfig();

        if (!config.authentication || config.mode === "standalone") {
          return `export const configuredAuthProvider = undefined;`;
        }
        // TODO: Validate that the authConfig.type is a valid authentication provider
        return [
          `const config = {
            ...${JSON.stringify(config.authentication, null, 2)},
            basePath: ${config.basePath ? JSON.stringify(config.basePath) : "undefined"},
          };`,
          config.mode === "internal"
            ? `import authProvider from "${config.moduleDir}/src/lib/authentication/providers/${config.authentication.type}.tsx";`
            : `import authProvider from "zudoku/auth/${config.authentication.type}";`,
          `export const configuredAuthProvider = authProvider(config);`,
        ].join("\n");
      }
    },
  };
};

export default viteAuthPlugin;
