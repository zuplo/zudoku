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
    { id: "https://github.com/zuplo/zudoku/discussions", label: "GitHub Discussions" },
    { id: "https://github.com/zuplo/zudoku/issues", label: "Submit an issue" },
  ],
  sidebar: {
    documentation: [
      {
        type: "doc",
        label: "Introduction",
        id: "introduction",
      },
      {
        type: "category",
        label: "Getting started",
        items: ["getting-started", "installation",  "configuration"],
      },
      {
        type: "category",
        label: "Advanced",
        items: ["authentication",  "api-keys", "using-multiple-apis"],
      },
      {
        type: "category",
        label: "Plugins",
        items: ["search", "custom-pages"],
      },
      {
        type: "category",
        label: "Deployment",
        items: ["deployment", "deploy/cloudflare-pages", "deploy/github-pages", "deploy/vercel", "deploy/direct-upload"],
      }
    ],
  },
};

export default config;
