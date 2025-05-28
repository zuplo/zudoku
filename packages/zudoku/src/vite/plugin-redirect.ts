import { type Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";

const viteRedirectPlugin = (): Plugin => {
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
        const config = getCurrentConfig();
        if (!config.redirects || config.__meta.mode === "standalone") {
          return `export const configuredRedirectPlugin = undefined;`;
        }

        const code: string[] = [
          `const redirects = ${JSON.stringify(config.redirects ?? [], null, 2)};`,
          config.__meta.mode === "internal"
            ? `import { redirectPlugin } from "${config.__meta.moduleDir}/src/lib/plugins/redirect/index.tsx";`
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
