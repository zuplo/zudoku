import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  page: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  basePath: "/docs",
  navigation: [
    {
      type: "category",
      label: "Documentation",
      items: ["/introduction"],
    },
    { type: "link", href: "/api", label: "API Reference" },
  ],
  redirects: [{ from: "/", to: "/introduction" }],
  apis: {
    type: "file",
    input: "../config/routes.oas.json",
    path: "api",
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
