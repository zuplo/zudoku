import { Plugin } from "vite";
import { ZudokuPluginOptions } from "../config/config.js";
import { themeToggle } from "../lib/themeToggle.js";

export const viteHtmlTransform = (_config: ZudokuPluginOptions): Plugin => {
  return {
    name: "zudoku-html-transform",
    transformIndexHtml: () => [
      {
        tag: "script",
        attrs: { type: "module" },
        injectTo: "head",
        children: `(${themeToggle.toString()})();`,
      },
    ],
  };
};
