import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  basePath: "/docs",
  topNavigation: [
    { id: "docs", label: "Documentation" },
    { id: "api", label: "API Reference" },
  ],
  sidebar: {
    docs: [
      {
        type: "category",
        label: "Overview",
        items: ["/introduction"],
      },
    ],
  },
  redirects: [{ from: "/", to: "/introduction" }],
  apis: {
    type: "file",
    input: "../config/routes.oas.json",
    navigationId: "api",
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
  authentication: {
    type: "auth0",
    domain: "auth.zuplo.io",
    clientId: "v0cOpST3pX6NIs1VGLVvNjaN3mSBomKk",
    audience: "https://api.example.com/",
  },
  apiKeys: {
    enabled: true,
  },
};

export default config;
