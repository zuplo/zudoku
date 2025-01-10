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

const hexToHSLA = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  // Convert to degrees and percentages
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
};

const isHexColor = (value: string): boolean => {
  return /^#([A-Fa-f0-9]{3}){1,2}$/.test(value);
};

const processColorValue = (value: string | undefined): string => {
  if (!value) return '';
  if (isHexColor(value)) {
    return hexToHSLA(value);
  }
  return value;
};

const generateCss = (theme: Theme) =>
  objectEntries(theme)
    .filter(([key]) => THEME_VARIABLES.includes(key))
    .map(([key, value]) => {
      const processedValue = processColorValue(value);
      return `--${uncamelize(key)}:${processedValue};`;
    })
    .join("\n");

export const viteThemeCss = (getConfig: () => ZudokuPluginOptions): Plugin => {
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

      // It's important that @import statements come first:
      // > "@import must precede all other statements (besides @charset or empty @layer)"
      if (config.theme?.fonts?.sans) {
        cssParts.push(`@import url('${config.theme.fonts.sans.url}');`);
      }
      if (config.theme?.fonts?.mono) {
        cssParts.push(`@import url('${config.theme.fonts.mono.url}');`);
      }

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
