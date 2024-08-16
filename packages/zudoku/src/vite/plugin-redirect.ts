import { Plugin } from "vite";
import { ZudokuPluginOptions } from "../config/config.js";

const viteRedirectPlugin = (config: ZudokuPluginOptions): Plugin => {
  const virtualModuleId = "virtual:zudoku-redirect-plugin";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "zudoku-redirect-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        if (!config.redirects || config.mode === "standalone") {
          return `export const configuredRedirectPlugin = undefined;`;
        }

        const code: string[] = [
          `const redirects = ${JSON.stringify(config.redirects ?? [], null, 2)};`,
          config.mode === "internal"
            ? `import { redirectPlugin } from "${config.moduleDir}/src/lib/plugins/redirect/index.tsx";`
            : `import { redirectPlugin } from "zudoku/plugins/redirect";`,
        ];

        code.push(
          `export const configuredRedirectPlugin = redirectPlugin({ redirects });`,
        );

        return {
          code: code.join("\n"),
          map: null,
        };
      }
    },
  };
};

export default viteRedirectPlugin;
