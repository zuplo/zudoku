import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";

const viteApiPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  const virtualModuleId = "virtual:zudoku-api-plugins";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "zudoku-api-plugins",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id, options) {
      if (id === resolvedVirtualModuleId) {
        const config = getConfig();

        const code = [
          `import { openApiPlugin } from "zudoku/plugins/openapi";`,
          `const configuredApiPlugins = [];`,
        ];

        if (config.apis) {
          const apis = Array.isArray(config.apis) ? config.apis : [config.apis];
          apis.forEach((c) => {
            code.push(
              ...[
                `// @ts-ignore`, // To make tests pass
                `configuredApiPlugins.push(openApiPlugin(${JSON.stringify({ ...c, inMemory: options?.ssr ?? config.mode === "internal" })}));`,
              ],
            );
          });
        }

        code.push(`export { configuredApiPlugins };`);

        return { code: code.join("\n") };
      }
    },
  };
};

export default viteApiPlugin;
