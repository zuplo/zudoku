import type { ZudokuConfig } from "zudoku";
import { sidebar } from "./sidebar";
import PreviewBanner from "./src/PreviewBanner";

const config: ZudokuConfig = {
  page: {
    banner: {
      message: <PreviewBanner />,
    },
  },
  metadata: {
    title: "%s | Zudoku",
    favicon: "https://cdn.zudoku.dev/logos/favicon.svg",
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
  sitemap: {
    siteUrl: "https://zudoku.dev",
    outDir: "docs/",
  },
  redirects: [
    { from: "/", to: "/docs" },
    { from: "/docs/getting-started", to: "/docs/app-quickstart" },
  ],
  topNavigation: [{ id: "docs", label: "Documentation" }],
  sidebar,
};

export default config;
