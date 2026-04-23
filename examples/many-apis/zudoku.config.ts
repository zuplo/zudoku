import type { Navigation, ZudokuConfig } from "zudoku";
import { defaultLanguages } from "zudoku";
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
      label: "List of APIs",
      link: "overview",
      items: navigation as Navigation,
    },
  ],
  syntaxHighlighting: {
    languages: [...defaultLanguages, "csv"],
  },
  search: {
    type: "pagefind",
  },
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
