import path from "node:path";
import { type Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { objectEntries } from "../lib/util/objectEntries.js";
import { fetchShadcnRegistryTheme } from "../lib/util/shadcn-registry.js";

// prettier-ignore
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

const MAIN_REPLACE = "/* @vite-plugin-inject main */";

// prettier-ignore
const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Poppins", "Montserrat", "Outfit",
  "Plus Jakarta Sans", "DM Sans", "IBM Plex Sans", "Geist", "Oxanium",
  "Architects Daughter", "Merriweather", "Playfair Display", "Lora",
  "Source Serif Pro", "Libre Baskerville", "Space Grotesk", "JetBrains Mono",
  "Fira Code", "Source Code Pro", "IBM Plex Mono", "Roboto Mono", "Space Mono", "Geist Mono",
];

const getGoogleFontUrl = (font: string) =>
  `https://fonts.googleapis.com/css2?family=${font.replaceAll(/\s+/g, "+")}:wght@400;500;600;700&display=swap`;

const processFontFamilies = (fontValue: string) => {
  const families = fontValue
    .split(",")
    .map((f) => f.trim().replaceAll(/['"]/g, ""));

  return families.flatMap((family) =>
    GOOGLE_FONTS.includes(family) ? getGoogleFontUrl(family) : family,
  );
};

export const viteThemePlugin = (): Plugin => {
  const virtualModuleId = "virtual:zudoku-theme.css";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  return {
    // It is important to run before the Tailwind plugin
    enforce: "pre",
    name: "zudoku-css-theme",
    resolveId(id) {
      if (id === "virtual:zudoku-theme.css") {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      // Handle the virtual module for dynamic theme content
      if (id !== resolvedVirtualModuleId) return;

      const config = getCurrentConfig();

      const themeConfig = config.theme ?? {};
      const themeCss: string[] = [];
      const fontImports: string[] = [];

      const userFonts = {
        sans: themeConfig.fonts?.sans?.url,
        serif: themeConfig.fonts?.serif?.url,
        mono: themeConfig.fonts?.mono?.url,
      };

      fontImports.push(
        ...Object.values(userFonts)
          .flatMap((font) => (font ? processFontFamilies(font) : []))
          .map((family) => `@import url('${family}');`),
      );

      if (themeConfig.registryUrl) {
        try {
          const registryItem = await fetchShadcnRegistryTheme(
            themeConfig.registryUrl,
          );

          // Extract theme variables from registry
          const {
            theme: regThemeVars = {},
            light: regLightVars = {},
            dark: regDarkVars = {},
          } = registryItem.cssVars ?? {};

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

          const themeFonts = {
            sans: lightVars["font-sans"] ?? regThemeVars["font-sans"],
            serif: lightVars["font-serif"] ?? regThemeVars["font-serif"],
            mono: lightVars["font-mono"] ?? regThemeVars["font-mono"],
          };

          fontImports.push(
            ...Object.values(themeFonts)
              .flatMap((font) => (font ? processFontFamilies(font) : []))
              .map((family) => `@import url('${family}');`),
          );

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
          // eslint-disable-next-line no-console
          console.error("Failed to load shadcn registry theme:", error);
        }
      }

      {
        if (themeConfig.light) {
          themeCss.push(`:root {\n${generateCss(themeConfig.light)}\n}`);
        }
        if (themeConfig.dark) {
          themeCss.push(`.dark {\n${generateCss(themeConfig.dark)}\n}`);
        }

        if (themeConfig.fonts?.sans?.fontFamily) {
          themeCss.push(
            `:root {\n  --font-sans: ${themeConfig.fonts.sans.fontFamily};\n}`,
          );
        }
        if (themeConfig.fonts?.serif?.fontFamily) {
          themeCss.push(
            `:root {\n  --font-serif: ${themeConfig.fonts.serif.fontFamily};\n}`,
          );
        }
        if (themeConfig.fonts?.mono?.fontFamily) {
          themeCss.push(
            `:root {\n  --font-mono: ${themeConfig.fonts.mono.fontFamily};\n}`,
          );
        }
      }

      if (fontImports.length === 0) {
        fontImports.push(
          `@import url('${getGoogleFontUrl("Geist")}');`,
          `@import url('${getGoogleFontUrl("Geist Mono")}');`,
        );
        themeCss.push(
          ":root {",
          "  --font-sans: Geist, sans-serif;",
          '  --font-mono: "Geist Mono", monospace;',
          "}",
        );
      }

      return [...fontImports, ...themeCss].join("\n");
    },
    async transform(src, id) {
      // Handle static theme content in main.css
      // This goes through the normal CSS pipeline so Tailwind can process it
      if (!id.endsWith("/src/app/main.css")) return;

      const config = getCurrentConfig();

      const files = new Set(
        [config.__meta.rootDir, ...config.__meta.dependencies].map((file) =>
          path.relative(path.dirname(id), file),
        ),
      );

      const code = [...files].map((file) => `@source "${file}";`);

      code.push("@theme inline {");

      // Always add basic color mappings to @theme block for Tailwind utilities
      // These map CSS variables to Tailwind color tokens (e.g., bg-primary uses --color-primary)

      // prettier-ignore
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
        `  --shadow-2xs: var(--shadow-2xs);`,
        `  --shadow-xs: var(--shadow-xs);`,
        `  --shadow-sm: var(--shadow-sm);`,
        `  --shadow: var(--shadow);`,
        `  --shadow-md: var(--shadow-md);`,
        `  --shadow-lg: var(--shadow-lg);`,
        `  --shadow-xl: var(--shadow-xl);`,
        `  --shadow-2xl: var(--shadow-2xl);`,
      );

      // NOTE: Font imports and declarations are handled by virtual:zudoku-theme.css
      // This @theme block only maps CSS variables to Tailwind utilities

      code.push("}");

      return src.replace(MAIN_REPLACE, code.join("\n"));
    },
  };
};
