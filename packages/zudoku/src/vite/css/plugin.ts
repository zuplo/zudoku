// Taken and adapted from
// https://github.com/hi-ogawa/vite-plugins/tree/main/packages/ssr-css
import path from "node:path";
import { type DevEnvironment, isCSSRequest, type Plugin } from "vite";
import type { ZudokuPluginOptions } from "../../config/config.js";
import { collectStyle } from "./collect.js";

const VIRTUAL_ENTRY = "virtual:ssr-css.css";

export function vitePluginSsrCss(
  getConfig: () => ZudokuPluginOptions,
  pluginOpts: { entries: string[] },
): Plugin {
  let server: DevEnvironment;

  const config = getConfig();

  const virtualHref = path.join(
    config.basePath ?? "",
    `/@id/__x00__${VIRTUAL_ENTRY}`,
  );
  const cssModuleMap = new Map<string, string>();

  return {
    name: "zudoku-ssr-css",
    apply: "serve",
    configureServer(server_) {
      server = server_.environments.ssr;

      // invalidate virtual modules for each inline request
      server_.middlewares.use((req, _res, next) => {
        if (req.url === virtualHref) {
          invalidateModule(server, `\0${VIRTUAL_ENTRY}?direct`);
        }
        next();
      });
    },

    resolveId(id) {
      return id.startsWith(VIRTUAL_ENTRY) ? `\0${id}` : undefined;
    },
    transform(code, id) {
      if (!isCSSRequest(id)) return;

      cssModuleMap.set(id, code);
    },
    async load(id) {
      if (!id.startsWith(`\0${VIRTUAL_ENTRY}`)) return;

      const url = new URL(id.slice(1), "https://test.local");
      let code = await collectStyle(server, pluginOpts.entries, cssModuleMap);
      if (!url.searchParams.has("direct")) {
        code = `export default ${JSON.stringify(code)};`;
      }
      return code;
    },

    // also expose via transformIndexHtml
    transformIndexHtml: {
      handler: async () => {
        return [
          {
            tag: "link",
            injectTo: "head",
            attrs: {
              rel: "stylesheet",
              href: virtualHref,
              "data-ssr-css": true,
            },
          },
          {
            tag: "script",
            injectTo: "head",
            attrs: { type: "module" },
            children: `
              import { createHotContext } from "/@vite/client";
              const hot = createHotContext("/__clear_ssr_css");
              hot.on("vite:afterUpdate", () => {
                document.querySelectorAll("[data-ssr-css]").forEach(node => node.remove());
              });
            `,
          },
        ];
      },
    },
  };
}

function invalidateModule(server: DevEnvironment, id: string) {
  const mod = server.moduleGraph.getModuleById(id);
  if (mod) {
    server.moduleGraph.invalidateModule(mod);
  }
}
