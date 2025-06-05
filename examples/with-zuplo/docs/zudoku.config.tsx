import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  page: {
    pageTitle: "My Developer Portal",
    banner: {
      message: (
        <div className="w-full text-center">
          <strong>Congrats!</strong> 🙌 You just created your first developer
          portal.
        </div>
      ),
      color: "info",
      dismissible: true,
    },
  },
  basePath: "/docs",
  topNavigation: [
    { id: "docs", label: "Documentation" },
    { id: "api", label: "API Reference" },
  ],
  sidebar: {
    docs: [
      {
        type: "category",
        label: "Getting Started",
        icon: "sparkles",
        items: [
          "/introduction",
          {
            type: "link",
            icon: "folder-cog",
            badge: {
              label: "New",
              color: "purple",
            },
            label: "API Reference",
            href: "/api",
          },
        ],
      },
      {
        type: "category",
        label: "Useful Links",
        collapsible: false,
        icon: "link",
        items: [
          {
            type: "link",
            label: "Zuplo Docs",
            href: "https://zuplo.com/docs/dev-portal/introduction",
          },
          {
            type: "link",
            label: "Developer Portal Docs",
            href: "https://zuplo.com/docs/dev-portal/introduction",
          },
        ],
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
