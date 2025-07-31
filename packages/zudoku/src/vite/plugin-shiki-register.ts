import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import {
  defaultHighlightOptions,
  defaultLanguages,
  highlighter,
} from "../lib/shiki.js";

export const viteShikiRegisterPlugin = (): Plugin => {
  const virtualModuleId = "virtual:zudoku-shiki-register";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

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

      const themes = Object.values(
        config.syntaxHighlighting?.themes ?? defaultHighlightOptions.themes,
      );

      await Promise.all([
        highlighter.loadTheme(
          ...themes.map((theme) => import(`@shikijs/themes/${theme}`)),
        ),
        highlighter.loadLanguage(
          ...languages.map((lang) => import(`@shikijs/langs/${lang}`)),
        ),
      ]);

      const code = [
        "export const registerShiki = async (highlighter) => {",
        "  await Promise.all([",
        "    highlighter.loadTheme(",
        themes.map((t) => `import('zudoku/shiki/themes/${t}')`).join(","),
        "    ),",
        "    highlighter.loadLanguage(",
        languages.map((l) => `import('zudoku/shiki/langs/${l}')`).join(","),
        "    ),",
        "  ]);",
        "};",
      ];

      return code.join("\n");
    },
  };
};
