import type { Navigation, ZudokuConfig } from "zudoku";
import apis from "./apis/_apis.json";
import navigation from "./apis/_navigation.json";

const config: ZudokuConfig = {
  site: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  navigation: [
    {
      type: "category",
      label: "Overview",
      items: navigation as Navigation,
    },
  ],

  redirects: [{ from: "/", to: "/overview" }],
  apis: apis as ZudokuConfig["apis"],
  defaults: {
    apis: {
      expandAllTags: false,
    },
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
};

export default config;
