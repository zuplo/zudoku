import type { SidebarEntry, ZudokuConfig } from "zudoku";
import apis from "./apis/_apis.json";
import navigation from "./apis/_navigation.json";

const config: ZudokuConfig = {
  page: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  topNavigation: [
    {
      id: "overview",
      label: "Overview",
    },
  ],
  sidebar: {
    overview: navigation as SidebarEntry,
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
