import { readFile } from "fs/promises";
import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";
import { OpenApiPluginOptions } from "../lib/plugins/openapi/index.js";

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
          for (const c of apis) {
            let apiConfig: OpenApiPluginOptions;
            if (c.type === "file") {
              let data = await readFile(c.input, "utf-8");

              if (!data.trim().startsWith("{")) {
                const yaml = await import("yaml");
                data = yaml.parse(data);
              }

              apiConfig = {
                ...c,
                type: "raw",
                input: data,
              };
            } else {
              apiConfig = c;
            }

            code.push(
              ...[
                `// @ts-ignore`, // To make tests pass
                `configuredApiPlugins.push(openApiPlugin(${JSON.stringify({ ...apiConfig, inMemory: options?.ssr ?? config.mode === "internal" })}));`,
              ],
            );
          }
        }

        code.push(`export { configuredApiPlugins };`);

        return { code: code.join("\n") };
      }
    },
  };
};

export default viteApiPlugin;
