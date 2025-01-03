import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";

const defaultLanguages = [
  "bash",
  "ruby",
  "markup",
  "json",
  "java",
  "csharp",
  "objectivec",
  "markdown",
  "javascript",
  "typescript",
];

const vitePrismPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  const virtualModuleId = "virtual:zudoku-prism";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "zudoku-prism-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const config = getConfig();
        const languages = [
          ...defaultLanguages,
          ...(config.theme?.code?.additionalLanguages ?? []),
        ];
        return [
          ...languages.map((lang) => {
            const loc = import.meta.resolve(
              `prismjs/components/prism-${lang}.min.js`,
            );
            return `import("${loc}");`;
          }),
        ].join("\n");
      }
    },
  };
};

export default vitePrismPlugin;
