import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  page: {
    pageTitle: "",
    logo: {
      src: {
        light: "/logos/zudoku-light.svg",
        dark: "/logos/zudoku-dark.svg",
      },
      width: "99px",
    },
  },
  metadata: {
    title: "%s | Zudoku",
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
  redirects: [
    { from: "/", to: "/documentation/introduction" },
    { from: "/documentation", to: "/documentation/introduction" },
  ],
  topNavigation: [
    { id: "documentation", label: "Documentation" },
  ],
  sidebar: {
    documentation: [
      {
        type: "category",
        label: "Overview",
        items: ["introduction", "getting-started"],
      }
    ],
  },
};

export default config;
