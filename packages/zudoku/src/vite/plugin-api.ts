import fs from "node:fs/promises";
import path from "node:path";
import { type Plugin } from "vite";
import yaml from "yaml";
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

          const tmpDir = path.posix.join(
            config.rootDir,
            "node_modules/.zudoku/processed",
          );
          await fs.rm(tmpDir, { recursive: true, force: true });
          await fs.mkdir(tmpDir, { recursive: true });

          for (const apiConfig of apis) {
            if (apiConfig.type === "file") {
              const fileContent = await fs.readFile(apiConfig.input, "utf-8");

              let schema = /\.ya?ml$/.test(apiConfig.input)
                ? yaml.parse(fileContent)
                : JSON.parse(fileContent);

              for (const postProcessor of apiConfig.postProcessors ?? []) {
                schema = await postProcessor(schema);
              }

              const processedFilePath = path.posix.join(
                tmpDir,
                `${path.basename(apiConfig.input)}.json`,
              );

              await fs.writeFile(processedFilePath, JSON.stringify(schema));
              code.push(
                "configuredApiPlugins.push(openApiPlugin({",
                '  type: "file",',
                `  input: () => import("${processedFilePath}"),`,
                `  navigationId: "${apiConfig.navigationId}",`,
                "}));",
              );
            } else {
              code.push(
                `// @ts-ignore`, // To make tests pass
                `configuredApiPlugins.push(openApiPlugin(${JSON.stringify({
                  ...apiConfig,
                  inMemory: options?.ssr ?? config.mode === "internal",
                })}));`,
              );
            }
          }
        }

        code.push(`export { configuredApiPlugins };`);

        return code.join("\n");
      }
    },
  };
};

export default viteApiPlugin;
