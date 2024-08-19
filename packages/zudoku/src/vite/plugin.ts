import react from "@vitejs/plugin-react";
import { type PluginOption } from "vite";
import { ZudokuPluginOptions } from "../config/config.js";
import viteApiKeysPlugin from "./plugin-api-keys.js";
import viteApiPlugin from "./plugin-api.js";
import viteAuthPlugin from "./plugin-auth.js";
import viteAliasPlugin from "./plugin-component.js";
import viteConfigPlugin from "./plugin-config.js";
import viteCustomCss from "./plugin-custom-css.js";
import viteDocsPlugin from "./plugin-docs.js";
import { viteHtmlTransform } from "./plugin-html-transform.js";
import viteMdxPlugin from "./plugin-mdx.js";
import viteRedirectPlugin from "./plugin-redirect.js";
import { viteSidebarPlugin } from "./plugin-sidebar.js";

export default function vitePlugin(
  config: ZudokuPluginOptions,
): PluginOption[] {
  return [
    viteMdxPlugin(config),
    react({ include: /\.(mdx?|jsx?|tsx?)$/ }),
    viteConfigPlugin(config),
    viteApiKeysPlugin(config),
    viteAuthPlugin(config),
    viteDocsPlugin(config),
    viteSidebarPlugin(config),
    viteApiPlugin(config),
    viteAliasPlugin(config),
    viteRedirectPlugin(config),
    viteCustomCss(config),
    viteHtmlTransform(config),
  ];
}
