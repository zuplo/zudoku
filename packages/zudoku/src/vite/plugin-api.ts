import { readFile } from "fs/promises";
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
          for (const c of apis) {
            if (c.type === "file") {
              const raw = await readFile(c.input, "utf-8");

              let data: unknown;
              if (raw.trim().startsWith("{")) {
                data = JSON.parse(raw);
              } else {
                const yaml = await import("yaml");
                data = yaml.parse(raw);
              }

              c.input = JSON.stringify(data);
            }

            code.push(
              ...[
                `// @ts-ignore`, // To make tests pass
                `configuredApiPlugins.push(openApiPlugin(${JSON.stringify({ ...c, inMemory: options?.ssr ?? config.mode === "internal" })}));`,
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
