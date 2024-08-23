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
        label: "Zudoku",
        items: ["introduction"],
      },
      {
        type: "category",
        label: "Getting started",
        items: ["getting-started", "installation",  "configuration"],
      },
      {
        type: "category",
        label: "Advanced",
        items: ["authentication", "search",  "api-keys", "using-multiple-apis"],
      },
      {
        type: "category",
        label: "Plugins",
        items: ["plugins"],
      },
      {
        type: "category",
        label: "Deployment",
        items: ["deployment"],
      }
    ],
  },
};

export default config;
