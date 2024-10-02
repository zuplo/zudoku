import { type Plugin } from "vite";
import type { LoadedConfig } from "./config.js";

const viteRedirectPlugin = (getConfig: () => LoadedConfig): Plugin => {
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
        const config = getConfig();
        if (!config.redirects || process.env.ZUDOKU_ENV === "standalone") {
          return `export const configuredRedirectPlugin = undefined;`;
        }

        const code: string[] = [
          `const redirects = ${JSON.stringify(config.redirects ?? [], null, 2)};`,
          process.env.ZUDOKU_ENV === "internal"
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
