import type { ZudokuConfig } from "zudoku";
import { sidebar } from "./sidebar";

const config: ZudokuConfig = {
  page: {
    logo: {
      src: {
        light: "/docs-static/logos/zudoku-light.svg",
        dark: "/docs-static/logos/zudoku-dark.svg",
      },
      width: "99px",
    },
  },
  metadata: {
    title: "%s | Zudoku",
    favicon: "https://cdn.zudoku.dev/logos/favicon.svg",
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
  redirects: [
    { from: "/", to: "/introduction" },
    { from: "/docs", to: "/docs/getting-started" },
  ],
  topNavigation: [
    { id: "introduction", label: "Introduction" },
    { id: "docs", label: "Documentation" },
    {
      id: "https://github.com/zuplo/zudoku/discussions",
      label: "GitHub Discussions",
    },
    { id: "https://github.com/zuplo/zudoku/issues", label: "Submit an issue" },
  ],
  sidebar,
};

export default config;
