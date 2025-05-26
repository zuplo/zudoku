import path from "node:path";
import type { Plugin } from "vite";
import type { LoadedConfig } from "../config/config.js";

// Font imports need to be at the very top of the file
const FONT_REPLACE = "/* @vite-plugin-inject font */";
const MAIN_REPLACE = "/* @vite-plugin-inject main */";

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
      const fontImports: string[] = [];

      code.push("@theme {");

      if (config.theme?.fonts?.sans) {
        fontImports.push(`@import url('${config.theme.fonts.sans.url}');`);
        code.push(
          `  --font-sans: ${config.theme.fonts.sans.fontFamily}, sans-serif;`,
        );
      } else {
        fontImports.push("@import url('./font.geist.css');");
        code.push("  --font-sans: Geist, sans-serif;");
        code.push(
          '  --font-display--font-feature-settings: "rlig" 1, "calt" 0;',
        );
      }

      if (config.theme?.fonts?.mono) {
        fontImports.push(`@import url('${config.theme.fonts.mono.url}');`);
        code.push(
          `  --font-mono: ${config.theme.fonts.mono.fontFamily}, monospace;`,
        );
      }

      code.push("}");

      return src
        .replace(FONT_REPLACE, fontImports.join("\n"))
        .replace(MAIN_REPLACE, code.join("\n"));
    },
  };
};
