import type { ZudokuConfig } from "zudoku";
import { DocusaurusDocsLicense } from "./src/DocusaurusDocsLicense";
import PreviewBanner from "./src/PreviewBanner";

const config: ZudokuConfig = {
  basePath: "/docs",
  page: {
    banner: {
      message: <PreviewBanner />,
      dismissible: true,
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
    { from: "/components", to: "/components/callout" },
  ],
  topNavigation: [
    { id: "docs", label: "Documentation" },
    { id: "components", label: "Components" },
  ],
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
          "configuration/customization",
          "configuration/sentry",
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
    components: [
      {
        icon: "component",
        type: "category",
        label: "Components",
        items: ["components/callout", "components/icons", "components/shadcn"],
      },
    ],
  },
};

export default config;
