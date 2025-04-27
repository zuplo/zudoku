import type { BundledLanguage } from "shiki";
import type { Plugin } from "vite";
import type { LoadedConfig } from "../config/config.js";
import {
  defaultHighlightOptions,
  defaultLanguages,
  highlighter,
} from "../lib/shiki.js";
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
    async load(id) {
      if (id !== resolvedVirtualModuleId) return;
      const config = getCurrentConfig();

      const languages =
        config.syntaxHighlighting?.languages ?? defaultLanguages;

      const themes = config.syntaxHighlighting?.themes;
      const lightTheme = themes?.light ?? defaultHighlightOptions.themes.light;
      const darkTheme = themes?.dark ?? defaultHighlightOptions.themes.dark;

      await highlighter.loadTheme(lightTheme, darkTheme);
      await highlighter.loadLanguage(...(languages as BundledLanguage[]));

      const code = [
        "export const registerShiki = async (highlighter) => {",
        `  await Promise.all([`,
        `    highlighter.loadTheme("${lightTheme}", "${darkTheme}"),`,
        `    highlighter.loadLanguage(...${JSON.stringify(languages)}),`,
        "  ]);",
        "};",
      ];

      return code.join("\n");
    },
  };
};
