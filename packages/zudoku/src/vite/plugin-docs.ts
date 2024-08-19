import { type Plugin } from "vite";
import type { DocsConfig, ZudokuPluginOptions } from "../config/config.js";

function getDefaultConfigIfFilesExist() {
  return [{ files: "/pages/**/*.mdx" }];
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
    load(id) {
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
          `const configuredDocsPlugins = [];`,
        ];
        const docsConfigs: DocsConfig[] = config.docs
          ? Array.isArray(config.docs)
            ? config.docs
            : [config.docs]
          : getDefaultConfigIfFilesExist();

        docsConfigs.forEach((docsConfig) => {
          code.push(
            ...[
              `// @ts-ignore`, // To make tests pass
              `const markdownFiles = import.meta.glob(${JSON.stringify(docsConfig.files)}, {`,
              `  eager: false,`,
              `});`,
              `configuredDocsPlugins.push(markdownPlugin({ markdownFiles, defaultOptions: ${JSON.stringify(docsConfig.defaultOptions)} }));`,
            ],
          );
        });

        code.push(`export { configuredDocsPlugins };`);

        return {
          code: code.join("\n"),
          map: null,
        };
      }
    },
  };
};

export default viteDocsPlugin;
