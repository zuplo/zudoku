import type { Plugin } from "vite";
import type { LoadedConfig } from "../config/config.js";
import { defaultHighlightOptions, defaultLanguages } from "../lib/shiki.js";

export const viteShikiRegisterPlugin = (
  getCurrentConfig: () => LoadedConfig,
): Plugin => {
  const virtualModuleId = "virtual:zudoku-shiki-register";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "vite-plugin-shiki-register",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    api: {},
    load(id) {
      if (id !== resolvedVirtualModuleId) return;
      const config = getCurrentConfig();

      const languages =
        config.syntaxHighlighting?.languages ?? defaultLanguages;

      const code = [
        "export const registerShiki = async (highlighter) => {",
        "  const promises = [",
        `    highlighter.loadTheme('${config.syntaxHighlighting?.themes?.light ?? defaultHighlightOptions.themes.light}'),`,
        `    highlighter.loadTheme('${config.syntaxHighlighting?.themes?.dark ?? defaultHighlightOptions.themes.dark}'),`,
        ...languages.map(
          (language) => `highlighter.loadLanguage('${language}'),`,
        ),
        "  ];",
        "  await Promise.all(promises);",
        "};",
      ];

      return code.join("\n");
    },
  };
};
