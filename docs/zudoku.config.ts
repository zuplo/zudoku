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
  topNavigation: [
    { id: "docs", label: "Documentation" },
    {
      id: "https://github.com/zuplo/zudoku/discussions",
      label: "GitHub Discussions",
    },
    { id: "https://github.com/zuplo/zudoku/issues", label: "Submit an issue" },
  ],
  sidebar: {
    docs: [
      {
        type: "doc",
        label: "Introduction",
        id: "introduction",
      },
      {
        type: "category",
        label: "Getting started",
        items: ["getting-started", "installation", "configuration"],
      },
      {
        type: "category",
        label: "Advanced",
        items: ["authentication", "api-keys", "using-multiple-apis"],
      },
      {
        type: "category",
        label: "Plugins",
        items: ["search", "custom-pages"],
      },
      {
        type: "category",
        label: "Deployment",
        items: [
          "deployment",
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
