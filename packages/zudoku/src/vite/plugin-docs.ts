import { type Plugin } from "vite";
import { ZudokuDocsConfig } from "../config/validators/validate.js";
import type { LoadedConfig } from "./config.js";

const DEFAULT_DOCS_FILES = "/pages/**/*.{md,mdx}";

const viteDocsPlugin = (getConfig: () => LoadedConfig): Plugin => {
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

        if (process.env.ZUDOKU_ENV === "standalone") {
          return `export const configuredDocsPlugins = [];`;
        }

        const code: string[] = [
          // IMPORTANT! This path here is important, we MUST resolve
          // files here as Typescript from the appDir
          process.env.ZUDOKU_ENV === "internal"
            ? `import { markdownPlugin } from "${config.__meta.moduleDir}/src/lib/plugins/markdown/index.tsx";`
            : `import { markdownPlugin } from "zudoku/plugins/markdown";`,
          `const configuredDocsPlugins = [];`,
        ];

        const docsConfigs: ZudokuDocsConfig[] = config.docs
          ? Array.isArray(config.docs)
            ? config.docs
            : [config.docs]
          : [{ files: DEFAULT_DOCS_FILES }];

        docsConfigs.forEach((docsConfig) => {
          code.push(
            ...[
              `// @ts-ignore`, // To make tests pass
              `const markdownFiles = import.meta.glob(${JSON.stringify(docsConfig.files)}, {`,
              `  eager: false,`,
              `});`,
              `configuredDocsPlugins.push(markdownPlugin({ `,
              ` markdownFiles,`,
              ` defaultOptions: ${JSON.stringify(docsConfig.defaultOptions)},`,
              ` filesPath: ${JSON.stringify(docsConfig.files)}`,
              `}));`,
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
