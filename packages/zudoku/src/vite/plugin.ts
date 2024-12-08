import react from "@vitejs/plugin-react";
import { type PluginOption } from "vite";
import { vitePluginSsrCss } from "./css/plugin.js";
import { LoadedConfig, type ZudokuPluginOptions } from "../config/config.js";
import viteApiKeysPlugin from "./plugin-api-keys.js";
import viteApiPlugin from "./plugin-api.js";
import viteAuthPlugin from "./plugin-auth.js";
import viteAliasPlugin from "./plugin-component.js";
import { createConfigReloadPlugin } from "./plugin-config-reload.js";
import viteConfigPlugin from "./plugin-config.js";
import viteCustomPagesPlugin from "./plugin-custom-pages.js";
import viteDocsPlugin from "./plugin-docs.js";
import { viteFrontmatterPlugin } from "./plugin-frontmatter.js";
import viteMdxPlugin from "./plugin-mdx.js";
import viteRedirectPlugin from "./plugin-redirect.js";
import { viteSearchPlugin } from "./plugin-search.js";
import { viteSidebarPlugin } from "./plugin-sidebar.js";
import { viteThemeCss } from "./plugin-theme-css.js";

export default function vitePlugin(
  initialConfig: ZudokuPluginOptions,
  onConfigChange?: () => Promise<LoadedConfig>,
): PluginOption {
  const [configReloadPlugin, getCurrentConfig] = createConfigReloadPlugin(
    initialConfig,
    onConfigChange,
  );

  return [
    viteMdxPlugin(getCurrentConfig),
    vitePluginSsrCss(getCurrentConfig, {
      entries: ["zudoku/app/entry.server.tsx"],
    }),
    react({ include: /\.(mdx?|jsx?|tsx?)$/ }),
    viteConfigPlugin(getCurrentConfig),
    viteApiKeysPlugin(getCurrentConfig),
    viteCustomPagesPlugin(getCurrentConfig),
    viteAuthPlugin(getCurrentConfig),
    viteDocsPlugin(getCurrentConfig),
    viteFrontmatterPlugin(getCurrentConfig),
    viteSidebarPlugin(getCurrentConfig),
    viteApiPlugin(getCurrentConfig),
    viteSearchPlugin(getCurrentConfig),
    viteAliasPlugin(getCurrentConfig),
    viteRedirectPlugin(getCurrentConfig),
    viteThemeCss(getCurrentConfig),
    configReloadPlugin,
  ];
}
