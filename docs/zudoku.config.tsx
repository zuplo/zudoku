import type { ZudokuConfig } from "zudoku";

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
    { from: "/", to: "/docs/introduction" },
    { from: "/docs", to: "/docs/introduction" },
  ],
  topNavigation: [{ id: "docs", label: "Documentation" }],
  sidebar: {
    docs: [
      {
        type: "category",
        label: "Getting started",
        items: ["introduction", "getting-started", "installation"],
      },
      {
        type: "category",
        label: "Configuration",
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
        link: "markdown/overview",
        items: ["markdown/mdx", "markdown/admonitions", "markdown/code-blocks"],
      },
      {
        type: "category",
        label: "Guide",
        items: ["environment-variables", "custom-pages", "using-multiple-apis"],
      },
      {
        type: "category",
        label: "Extending",
        items: ["api-keys"],
      },
      {
        type: "category",
        label: "Deployment",
        link: "deployment",
        items: [
          "deploy/cloudflare-pages",
          "deploy/github-pages",
          "deploy/vercel",
          "deploy/direct-upload",
        ],
      },
    ],
  },
};

export default config;
