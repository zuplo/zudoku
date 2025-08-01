import path from "node:path";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import type {
  FontConfig,
  ZudokuConfig,
} from "../config/validators/validate.js";
import { objectEntries } from "../lib/util/objectEntries.js";
import {
  fetchShadcnRegistryItem,
  type RegistryItemCss,
} from "./shadcn-registry.js";

// biome-ignore format: for readability
const THEME_VARIABLES = [
  "background", "foreground", "card", "cardForeground", "popover", "popoverForeground", "primary",
  "primaryForeground", "secondary", "secondaryForeground", "muted", "mutedForeground", "accent",
  "accentForeground", "destructive", "destructiveForeground", "border", "input", "ring", "radius",
] as const;

const uncamelize = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export type Theme = Partial<Record<(typeof THEME_VARIABLES)[number], string>>;

const processColorValue = (value: string | undefined): string => {
  if (!value) return "";
  const color =
    !value.startsWith("#") &&
    !value.includes("(") &&
    value.split(" ").length >= 3
      ? // Assume legacy tailwind hsl format
        `hsl(${value})`
      : value;

  return color;
};

const generateCss = (theme: Theme) =>
  objectEntries(theme)
    .filter(([key]) => THEME_VARIABLES.includes(key))
    .map(([key, value]) => `--${uncamelize(key)}: ${processColorValue(value)};`)
    .join("\n");

const generateRegistryCss = (cssVars: Record<string, string>) =>
  Object.entries(cssVars)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");

const processCustomCss = (css: string | RegistryItemCss): string => {
  if (typeof css === "string") {
    return css;
  }

  const processStyles = (
    styles: RegistryItemCss | string,
    indent = "",
  ): string[] => {
    if (typeof styles === "string") {
      return [`${indent}${styles}`];
    }

    const rules = [];
    for (const [key, value] of Object.entries(styles)) {
      if (typeof value === "string") {
        rules.push(`${indent}${key}: ${value};`);
      } else {
        rules.push(`${indent}${key} {`);
        rules.push(...processStyles(value, `${indent}  `));
        rules.push(`${indent}}`);
      }
    }
    return rules;
  };

  return processStyles(css).join("\n");
};

const MAIN_REPLACE = "/* @vite-plugin-inject main */";
const DEFAULT_THEME_REPLACE = "/* @vite-plugin-inject defaultTheme */";

// biome-ignore format: for readability
export const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Poppins", "Montserrat", "Outfit",
  "Plus Jakarta Sans", "DM Sans", "IBM Plex Sans", "Geist", "Oxanium",
  "Architects Daughter", "Merriweather", "Playfair Display", "Lora",
  "Source Serif Pro", "Libre Baskerville", "Space Grotesk", "JetBrains Mono",
  "Fira Code", "Source Code Pro", "IBM Plex Mono", "Roboto Mono", "Space Mono", "Geist Mono",
] as const;
type GoogleFont = (typeof GOOGLE_FONTS)[number];

const getGoogleFontUrl = (font: string) =>
  `https://fonts.googleapis.com/css2?family=${font.replaceAll(/\s+/g, "+")}:wght@400;500;600;700&display=swap`;

const processFont = (fontValue: string) => {
  const families = fontValue
    .split(",")
    .map((f) => f.trim().replaceAll(/['"]/g, ""));

  return families
    .filter((family) => GOOGLE_FONTS.includes(family as GoogleFont))
    .map((family) => getGoogleFontUrl(family));
};

const processFontConfig = (fontConfig?: FontConfig) => {
  if (!fontConfig) return { url: undefined, fontFamily: undefined };

  if (typeof fontConfig === "string") {
    if (GOOGLE_FONTS.includes(fontConfig as GoogleFont)) {
      return {
        url: getGoogleFontUrl(fontConfig),
        fontFamily: fontConfig,
      };
    }
    return { url: undefined, fontFamily: fontConfig };
  }

  return {
    url: fontConfig.url,
    fontFamily: fontConfig.fontFamily,
  };
};

const processFonts = async (themeConfig: ZudokuConfig["theme"]) => {
  const imports: string[] = [];
  const families = {
    sans: "Geist, sans-serif",
    serif: undefined as string | undefined,
    mono: '"Geist Mono", monospace',
  };

  // Process user fonts
  const userFonts = {
    sans: processFontConfig(themeConfig?.fonts?.sans),
    serif: processFontConfig(themeConfig?.fonts?.serif),
    mono: processFontConfig(themeConfig?.fonts?.mono),
  };

  // Add user font imports
  for (const font of Object.values(userFonts)) {
    if (font.url) {
      imports.push(font.url);
    }
  }

  // Process registry fonts if available
  let registryFonts = {
    sans: undefined as string | undefined,
    serif: undefined as string | undefined,
    mono: undefined as string | undefined,
  };

  if (themeConfig?.registryUrl) {
    try {
      const registryItem = await fetchShadcnRegistryItem(
        themeConfig.registryUrl,
      );
      const { cssVars = {} } = registryItem;
      const { theme: regThemeVars = {}, light: regLightVars = {} } = cssVars;

      registryFonts = {
        sans: regLightVars["font-sans"] ?? regThemeVars["font-sans"],
        serif: regLightVars["font-serif"] ?? regThemeVars["font-serif"],
        mono: regLightVars["font-mono"] ?? regThemeVars["font-mono"],
      };

      // Add registry font imports
      for (const font of Object.values(registryFonts)) {
        if (font) {
          imports.push(...processFont(font));
        }
      }
    } catch {
      // Registry fonts failed to load, continue with user fonts and defaults
    }
  }

  // Determine final font families with priority: user > registry > defaults
  families.sans =
    userFonts.sans.fontFamily || registryFonts.sans || "Geist, sans-serif";
  families.serif = userFonts.serif.fontFamily || registryFonts.serif;
  families.mono =
    userFonts.mono.fontFamily ||
    registryFonts.mono ||
    '"Geist Mono", monospace';

  // Add default font imports if no user or registry fonts
  if (!userFonts.sans.fontFamily && !registryFonts.sans) {
    imports.push(getGoogleFontUrl("Geist"));
  }
  if (!userFonts.serif.fontFamily && !registryFonts.serif) {
    imports.push(getGoogleFontUrl("Playfair Display"));
  }
  if (!userFonts.mono.fontFamily && !registryFonts.mono) {
    imports.push(getGoogleFontUrl("Geist Mono"));
  }

  return { imports, families };
};

export const virtualModuleId = "virtual:zudoku-theme.css";
export const resolvedVirtualModuleId = `\0${virtualModuleId}`;

export const viteThemePlugin = (): Plugin => {
  return {
    // It is important to run before the Tailwind plugin
    enforce: "pre",
    name: "zudoku-css-theme",

    resolveId(id) {
      if (id === "virtual:zudoku-theme.css") {
        return resolvedVirtualModuleId;
      }
    },
    // Handle the virtual module for dynamic theme content
    async load(id) {
      if (id !== resolvedVirtualModuleId) return;

      const config = getCurrentConfig();

      const themeConfig = config.theme ?? {};
      const themeCss: string[] = [];

      // Consolidate all font processing
      const fonts = await processFonts(themeConfig);

      // Add all font imports at once
      if (fonts.imports.length > 0) {
        themeCss.push(...fonts.imports.map((url) => `@import url('${url}');`));
      }

      // Handle registry theme variables
      if (themeConfig.registryUrl) {
        try {
          const registryItem = await fetchShadcnRegistryItem(
            themeConfig.registryUrl,
          );

          // Extract theme variables from registry
          const { cssVars = {}, css = {} } = registryItem;
          const { light: regLightVars = {}, dark: regDarkVars = {} } = cssVars;

          // Process custom CSS from registry
          if (Object.keys(css).length > 0) {
            themeCss.push(processCustomCss(css));
          }

          // Merge registry variables with user overrides
          const applyOverrides = (
            vars: Record<string, string>,
            overrides?: Theme,
          ) => {
            if (!overrides) return vars;

            const result = { ...vars };
            for (const [key, value] of objectEntries(overrides)) {
              if (value && THEME_VARIABLES.includes(key)) {
                result[uncamelize(key)] = processColorValue(value);
              }
            }
            return result;
          };

          const lightVars = applyOverrides(regLightVars, themeConfig.light);
          const darkVars = applyOverrides(regDarkVars, themeConfig.dark);

          // Generate CSS for light and dark themes
          if (Object.keys(lightVars).length > 0) {
            themeCss.push(`:root {\n${generateRegistryCss(lightVars)}\n}`);
          }

          if (Object.keys(darkVars).length > 0) {
            themeCss.push(`.dark {\n${generateRegistryCss(darkVars)}\n}`);
          }

          if (lightVars["letter-spacing"] !== "0em") {
            themeCss.push(
              "@theme inline {",
              "  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);",
              "  --tracking-tight: calc(var(--tracking-normal) - 0.025em);",
              "  --tracking-normal: var(--tracking-normal);",
              "  --tracking-wide: calc(var(--tracking-normal) + 0.025em);",
              "  --tracking-wider: calc(var(--tracking-normal) + 0.05em);",
              "  --tracking-widest: calc(var(--tracking-normal) + 0.1em);",
              "}",
            );
            themeCss.push(
              `body {\n  letter-spacing: var(--tracking-normal);\n}`,
            );
          }
        } catch (error) {
          // biome-ignore lint/suspicious/noConsole: Logging allowed here
          console.error("Failed to load shadcn registry theme:", error);
        }
      }

      if (themeConfig.light) {
        themeCss.push(`:root {\n${generateCss(themeConfig.light)}\n}`);
      }
      if (themeConfig.dark) {
        themeCss.push(`.dark {\n${generateCss(themeConfig.dark)}\n}`);
      }

      // Add font family CSS variables
      const rootVars = [
        `  --font-sans: ${fonts.families.sans};`,
        `  --font-mono: ${fonts.families.mono};`,
      ];

      if (fonts.families.serif) {
        rootVars.push(`  --font-serif: ${fonts.families.serif};`);
      }

      themeCss.push(":root {", ...rootVars, "}");

      return themeCss.join("\n");
    },

    // Handle static theme content in main.css
    // This goes through the normal CSS pipeline so Tailwind can process it
    async transform(src, id) {
      if (!id.endsWith("/src/app/main.css")) return;

      const config = getCurrentConfig();

      const files = new Set(
        [config.__meta.rootDir, ...config.__meta.dependencies].map((file) =>
          path.relative(path.dirname(id), file),
        ),
      );

      const code = [...files].map((file) => `@source "${file}";`);

      // NOTE: Font imports and declarations are handled by virtual:zudoku-theme.css
      // This @theme block only maps CSS variables to Tailwind utilities
      code.push("@theme inline {");

      // biome-ignore format: for readability
      const colorVars = [
        "background", "foreground", "card", "card-foreground", "popover", "popover-foreground", "primary",
        "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground", "accent",
        "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring", "chart-1",
        "chart-2", "chart-3", "chart-4", "chart-5", "sidebar", "sidebar-foreground", "sidebar-primary",
        "sidebar-primary-foreground", "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
      ];

      code.push(
        ...colorVars.map((color) => `  --color-${color}: var(--${color});`),
      );

      code.push(
        `  --radius-sm: calc(var(--radius) - 4px);`,
        `  --radius-md: calc(var(--radius) - 2px);`,
        `  --radius-lg: var(--radius);`,
        `  --radius-xl: calc(var(--radius) + 4px);`,
        `  --font-sans: var(--font-sans);`,
        `  --font-mono: var(--font-mono);`,
        `  --font-serif: var(--font-serif);`,
      );

      code.push("}");

      const customCss = config.theme?.customCss;
      if (customCss) {
        code.push(processCustomCss(customCss));
      }

      const defaultThemeImport = config.theme?.noDefaultTheme
        ? ""
        : '@import "./defaultTheme.css" layer(theme);';

      return src
        .replace(DEFAULT_THEME_REPLACE, defaultThemeImport)
        .replace(MAIN_REPLACE, code.join("\n"));
    },
  };
};
