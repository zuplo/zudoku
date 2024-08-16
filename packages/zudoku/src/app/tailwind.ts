import typographyPlugin from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme.js";

const content = [
  "./src/**/*.{js,ts,jsx,tsx,md,mdx}",
  "./node_modules/zudoku/dist/**/*.{js,ts,jsx,tsx,md,mdx}",
];

const config: Omit<Config, "content"> = {
  darkMode: "selector",
  content,
  theme: {
    extend: {
      fontFamily: {
        sans: [
          ["Geist", ...defaultTheme.fontFamily.sans],
          { fontFeatureSettings: '"rlig" 1, "calt" 0' },
        ],
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
    },
  },
  plugins: [typographyPlugin],
};

export default config;
