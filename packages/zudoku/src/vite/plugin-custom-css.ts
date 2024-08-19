import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";
import { objectEntries } from "../lib/util/objectEntries.js";

const THEME_VARIABLES = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "destructiveForeground",
  "border",
  "input",
  "ring",
  "radius",
] as const;

const uncamelize = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export type Theme = Partial<Record<(typeof THEME_VARIABLES)[number], string>>;

const generateCss = (theme: Theme) =>
  objectEntries(theme)
    .filter(([key]) => THEME_VARIABLES.includes(key))
    .map(([key, value]) => `--${uncamelize(key)}:${value};`)
    .join("\n");

const viteCustomCss = (getConfig: () => ZudokuPluginOptions): Plugin => {
  const virtualModuleId = "virtual:zudoku-theme.css";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "zudoku-theme",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) return;

      const config = getConfig();

      const cssParts = [];
      if (config.theme?.light) {
        cssParts.push(`:root:root { ${generateCss(config.theme.light)} }`);
      }
      if (config.theme?.dark) {
        cssParts.push(`.dark.dark { ${generateCss(config.theme.dark)} }`);
      }

      return cssParts.join("\n");
    },
  };
};

export default viteCustomCss;
