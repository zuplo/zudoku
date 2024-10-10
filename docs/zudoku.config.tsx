import type { ZudokuConfig } from "zudoku";
import { sidebar } from "./sidebar";
import { DocusaurusDocsLicense } from "./src/DocusaurusDocsLicense";
import PreviewBanner from "./src/PreviewBanner";

const config: ZudokuConfig = {
  basePath: "/docs",
  page: {
    banner: {
      message: <PreviewBanner />,
    },
  },
  mdx: {
    components: { DocusaurusDocsLicense },
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
  },
  redirects: [
    { from: "/", to: "/introduction" },
    { from: "/getting-started", to: "/app-quickstart" },
  ],
  topNavigation: [{ id: "docs", label: "Documentation" }],
  sidebar,
};

export default config;
