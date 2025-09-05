import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";

const viteLlmsTxtConfigPlugin = (): Plugin => {
  const virtualModuleId = "virtual:zudoku-llms-txt-plugin";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  return {
    name: "zudoku-llms-txt-config-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const config = getCurrentConfig();

        if (config.__meta.mode === "standalone" || !config.llmsTxt) {
          return `export const configuredLlmsTxtPlugin = undefined;`;
        }

        const code: string[] = [
          config.__meta.mode === "internal"
            ? `import { llmsTxtPlugin } from "${config.__meta.moduleDir}/src/lib/plugins/llms-txt/index.tsx";`
            : `import { llmsTxtPlugin } from "zudoku/plugins/llms-txt";`,
        ];

        const options = JSON.stringify(config.llmsTxt, null, 2);

        code.push(
          `export const configuredLlmsTxtPlugin = llmsTxtPlugin(${options});`,
        );

        return code.join("\n");
      }
    },
  };
};

export default viteLlmsTxtConfigPlugin;
