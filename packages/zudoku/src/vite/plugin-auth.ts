import { type Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";

const viteAuthPlugin = (): Plugin => {
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
        const config = getCurrentConfig();

        if (!config.authentication || config.__meta.mode === "standalone") {
          return `export const configuredAuthProvider = undefined;`;
        }
        // TODO: Validate that the authConfig.type is a valid authentication provider
        return [
          `const config = {
            ...${JSON.stringify(config.authentication, null, 2)},
            basePath: ${config.basePath ? JSON.stringify(config.basePath) : "undefined"},
          };`,
          config.__meta.mode === "internal"
            ? `import authProvider from "${config.__meta.moduleDir}/src/lib/authentication/providers/${config.authentication.type}.tsx";`
            : `import authProvider from "zudoku/auth/${config.authentication.type}";`,
          `export const configuredAuthProvider = authProvider(config);`,
        ].join("\n");
      }
    },
  };
};

export default viteAuthPlugin;
