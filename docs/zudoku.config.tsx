import type { ZudokuConfig } from "zudoku";
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
  sidebar: {
    docs: [
      {
        type: "category",
        label: "Getting started",
        icon: "sparkles",
        items: ["introduction", "app-quickstart", "html-quickstart"],
      },
      {
        type: "category",
        label: "Configuration",
        icon: "cog",
        link: "configuration/overview",
        items: [
          "configuration/api-reference",
          "configuration/navigation",
          "configuration/search",
          "configuration/authentication",
          "configuration/vite-config",
        ],
      },
      {
        type: "category",
        label: "Markdown",
        icon: "book-open-text",
        link: "markdown/overview",
        items: ["markdown/mdx", "markdown/admonitions", "markdown/code-blocks"],
      },
      {
        type: "category",
        label: "Guide",
        icon: "monitor-check",
        items: ["environment-variables", "custom-pages", "using-multiple-apis"],
      },
      {
        type: "category",
        label: "Deployment",
        icon: "cloud-upload",
        link: "deployment",
        items: [
          "deploy/cloudflare-pages",
          "deploy/github-pages",
          "deploy/vercel",
          "deploy/direct-upload",
        ],
      },
      {
        type: "category",
        label: "Extending",
        icon: "blocks",
        items: ["custom-plugins", "api-keys"],
      },
    ],
  },
};

export default config;
