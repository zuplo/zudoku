import typographyPlugin from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme.js";
import type { LoadedConfig } from "../config/config.js";

const content = [
  "./src/**/*.{js,ts,jsx,tsx,md,mdx}",
  "./node_modules/zudoku/dist/**/*.{js,ts,jsx,tsx,md,mdx}",
];

const config = (zudokuConfig?: LoadedConfig): Omit<Config, "content"> => {
  const sans = zudokuConfig?.theme?.fonts?.sans
    ? ([
        zudokuConfig.theme.fonts.sans.fontFamily,
        ...defaultTheme.fontFamily.sans,
      ] as const)
    : ([
        ["Geist", ...defaultTheme.fontFamily.sans],
        { fontFeatureSettings: '"rlig" 1, "calt" 0' },
      ] as const);

  const mono = zudokuConfig?.theme?.fonts?.mono
    ? zudokuConfig.theme.fonts.mono.fontFamily
    : defaultTheme.fontFamily.mono;

  return {
    darkMode: "selector",
    content,
    theme: {
      extend: {
        keyframes: {
          "bounce-x-start": {
            "0%, 100%": { transform: "translateX(0)" },
            "50%": { transform: "translateX(-25%)" },
          },
          "bounce-x-end": {
            "0%, 100%": { transform: "translateX(0)" },
            "50%": { transform: "translateX(25%)" },
          },
        },
        animation: {
          "bounce-x-start": "bounce-x-start 1s infinite",
          "bounce-x-end": "bounce-x-end 1s infinite",
        },
        fontFamily: {
          sans,
          mono,
        },
        typography: () => ({
          DEFAULT: {
            css: {
              blockquote: { quotes: "none" },
            },
          },
        }),
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          xl: "calc(var(--radius) + 4px)",
          lg: `var(--radius)`,
          md: `calc(var(--radius) - 2px)`,
          sm: "calc(var(--radius) - 4px)",
        },
      },
    },
    plugins: [typographyPlugin],
  };
};

export default config;
