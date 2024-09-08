import { type Plugin } from "vite";
import type { ZudokuPluginOptions } from "../config/config.js";
import { DocResolver } from "../lib/plugins/markdown/resolver.js";
import { writePluginDebugCode } from "./debug.js";

function getDefaultConfigIfFilesExist() {
  return [{ files: "/pages/**/*.{md,mdx}" }];
}

const viteDocsPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  const virtualModuleId = "virtual:zudoku-docs-plugins";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "zudoku-docs-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const config = getConfig();

        if (config.mode === "standalone") {
          return `export const configuredDocsPlugins = [];`;
        }

        const code: string[] = [
          // IMPORTANT! This path here is important, we MUST resolve
          // files here as Typescript from the appDir
          config.mode === "internal"
            ? `import { markdownPlugin } from "${config.moduleDir}/src/lib/plugins/markdown/index.tsx";`
            : `import { markdownPlugin } from "zudoku/plugins/markdown";`,
          `const docsPluginOptions = [];`,
        ];

        const resolver = new DocResolver(config);
        const docsConfigs = resolver.getDocsConfigs();

        docsConfigs.forEach((docsConfig) => {
          code.push(
            ...[
              `// @ts-ignore`, // To make tests pass
              `const fileImports = import.meta.glob(${JSON.stringify(docsConfig.files)}, {`,
              `  eager: false,`,
              `});`,
              `docsPluginOptions.push({ `,
              ` fileImports,`,
              ` defaultOptions: ${JSON.stringify(docsConfig.defaultOptions)},`,
              ` files: ${JSON.stringify(docsConfig.files)}`,
              `});`,
            ],
          );
        });

        // Even though this returns an array, the plugin should be a single
        // instance because we need to make sure that there are not duplicate
        // routes even if different folders have been used.
        code.push(
          ...[
            `const configuredDocsPlugins = [markdownPlugin(docsPluginOptions)]`,
            `export { configuredDocsPlugins };`,
          ],
        );

        await writePluginDebugCode(config.rootDir, "docs-plugin", code);

        return {
          code: code.join("\n"),
          map: null,
        };
      }
    },
  };
};

export default viteDocsPlugin;
