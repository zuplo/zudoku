import { fileURLToPath } from "node:url";
import { bundledLanguagesInfo, type BundledLanguage } from "shiki";
import type { Plugin, PluginOption } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { defaultLanguages } from "../lib/shiki-constants.js";
import { defaultHighlightOptions, highlighterPromise } from "../lib/shiki.js";

const aliasToId = new Map(
  bundledLanguagesInfo.flatMap((lang) =>
    (lang.aliases ?? []).map((alias) => [alias, lang.id]),
  ),
);

// Resolve either an alias or the original language id
const resolveLang = (lang: BundledLanguage): string =>
  aliasToId.get(lang) ?? lang;

const viteShikiResolvePlugin = (): Plugin => {
  return {
    name: "vite-plugin-shiki-resolve",
    enforce: "pre",
    resolveId: {
      filter: { id: /^@shikijs\/(langs|themes)\/.+$/ },
      handler: (id) => fileURLToPath(import.meta.resolve(id)),
    },
  };
};

const viteShikiRegisterPlugin = (): Plugin => {
  const virtualModuleId = "virtual:zudoku-shiki-register";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  return {
    name: "vite-plugin-shiki-register",
    config() {
      const config = getCurrentConfig();
      const languages =
        config.syntaxHighlighting?.languages ?? defaultLanguages;
      const themes = Object.values(
        config.syntaxHighlighting?.themes ?? defaultHighlightOptions.themes,
      );

      return {
        optimizeDeps: {
          include: [
            ...languages.map((lang) => `@shikijs/langs/${resolveLang(lang)}`),
            ...themes.map((theme) => `@shikijs/themes/${theme}`),
          ],
        },
      };
    },
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

      const highlighter = await highlighterPromise;

      await Promise.all([
        highlighter.loadTheme(
          ...themes.map((theme) => import(`@shikijs/themes/${theme}`)),
        ),
        highlighter.loadLanguage(
          ...languages.map(
            (lang) => import(`@shikijs/langs/${resolveLang(lang)}`),
          ),
        ),
      ]);

      const code = [
        "export const registerShiki = async (highlighter) => {",
        "  await Promise.all([",
        "    highlighter.loadTheme(",
        themes.map((theme) => `import('@shikijs/themes/${theme}')`).join(","),
        "    ),",
        "    highlighter.loadLanguage(",
        languages
          .map((lang) => `import('@shikijs/langs/${resolveLang(lang)}')`)
          .join(","),
        "    ),",
        "  ]);",
        "};",
      ];

      return code.join("\n");
    },
  };
};

export const viteShikiPlugin = (): PluginOption => [
  viteShikiResolvePlugin(),
  viteShikiRegisterPlugin(),
];
