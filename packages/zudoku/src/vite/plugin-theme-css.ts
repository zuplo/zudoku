import Color from "colorjs.io";
import { type Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
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

const processColorValue = (value: string | undefined): string => {
  if (!value) return "";
  const c =
    !value.startsWith("#") &&
    !value.includes("(") &&
    value.split(" ").length >= 3
      ? // Assume legacy tailwind hsl format
        `hsl(${value})`
      : value;

  try {
    return new Color(c).to("oklch").toString();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Invalid color value:", value, e);
    return value;
  }
};

const generateCss = (theme: Theme) =>
  objectEntries(theme)
    .filter(([key]) => THEME_VARIABLES.includes(key))
    .map(([key, value]) => {
      const processedValue = processColorValue(value);
      return `--${uncamelize(key)}: ${processedValue};`;
    })
    .join("\n");

export const viteThemeCss = (): Plugin => {
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

      const config = getCurrentConfig();
      const cssParts = [];

      if (config.theme?.light) {
        cssParts.push(`:root {\n${generateCss(config.theme.light)}\n}`);
      }
      if (config.theme?.dark) {
        cssParts.push(`.dark {\n${generateCss(config.theme.dark)}\n}`);
      }

      return cssParts.join("\n");
    },
  };
};
