import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import { vitePluginSsrCss } from "./css/plugin.js";
import viteApiPlugin from "./plugin-api.js";
import viteApiKeysPlugin from "./plugin-api-keys.js";
import viteAuthPlugin from "./plugin-auth.js";
import viteAliasPlugin from "./plugin-component.js";
import viteConfigPlugin from "./plugin-config.js";
import { viteConfigReloadPlugin } from "./plugin-config-reload.js";
import viteCustomPagesPlugin from "./plugin-custom-pages.js";
import viteDocsPlugin from "./plugin-docs.js";
import { viteFrontmatterPlugin } from "./plugin-frontmatter.js";
import viteLlmsTxtPlugin from "./plugin-llms-txt.js";
import viteLlmsTxtConfigPlugin from "./plugin-llms-txt-config.js";
import viteMdxPlugin from "./plugin-mdx.js";
import { viteNavigationPlugin } from "./plugin-navigation.js";
import viteRedirectPlugin from "./plugin-redirect.js";
import { viteSearchPlugin } from "./plugin-search.js";
import { viteShikiRegisterPlugin } from "./plugin-shiki-register.js";
import { viteThemePlugin } from "./plugin-theme.js";

export default function vitePlugin(): PluginOption {
  return [
    viteShikiRegisterPlugin(),
    viteConfigReloadPlugin(),
    viteMdxPlugin(),
    react({ include: /\.(mdx?|jsx?|tsx?)$/ }),
    viteConfigPlugin(),
    viteApiKeysPlugin(),
    viteCustomPagesPlugin(),
    viteAuthPlugin(),
    viteDocsPlugin(),
    viteFrontmatterPlugin(),
    viteNavigationPlugin(),
    viteApiPlugin(),
    viteSearchPlugin(),
    viteLlmsTxtPlugin(),
    viteLlmsTxtConfigPlugin(),
    viteAliasPlugin(),
    viteRedirectPlugin(),
    vitePluginSsrCss({ entries: ["zudoku/app/entry.server.tsx"] }),
    viteThemePlugin(),
    tailwindcss(),
  ];
}
