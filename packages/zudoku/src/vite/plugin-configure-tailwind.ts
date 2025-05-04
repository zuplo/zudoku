import path from "node:path";
import type { Plugin } from "vite";
import type { LoadedConfig } from "../config/config.js";

const REPLACER = "/* @vite-plugin-inject */";

export const configureTailwindPlugin = (
  getCurrentConfig: () => LoadedConfig,
): Plugin => {
  return {
    name: "zudoku-configure-tailwind",
    enforce: "pre",
    transform(src, id) {
      if (!id.endsWith("/src/app/main.css")) return;

      const config = getCurrentConfig();

      const files = new Set(
        [config.__meta.rootDir, ...config.__meta.dependencies].map((file) =>
          path.relative(path.dirname(id), file),
        ),
      );

      const code = [...files].map((file) => `@source "${file}";`);

      code.push("@theme {");

      if (config.theme?.fonts?.sans) {
        code.unshift(`@import url('${config.theme.fonts.sans.url}');`);
        code.push(
          `  --font-sans: ${config.theme.fonts.sans.fontFamily}, sans-serif;`,
        );
      } else {
        code.push("  --font-sans: Geist, sans-serif;");
        code.push(
          '  --font-display--font-feature-settings: "rlig" 1, "calt" 0;',
        );
      }

      if (config.theme?.fonts?.mono) {
        code.unshift(`@import url('${config.theme.fonts.mono.url}');`);
        code.push(
          `  --font-mono: ${config.theme.fonts.mono.fontFamily}, monospace;`,
        );
      }

      code.push("}");

      return src.replace(REPLACER, code.join("\n"));
    },
  };
};
