import { type Plugin } from "vite";
import { themeToggle } from "../lib/themeToggle.js";

export const viteHtmlTransform = (): Plugin => {
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
