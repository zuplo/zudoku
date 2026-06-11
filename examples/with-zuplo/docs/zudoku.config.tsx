import type { ZudokuConfig } from "zudoku";
// Compiled from the Zuplo project by `zudoku generate`, which runs
// automatically before dev/build. It contains the detected OpenAPI files
// (e.g. ../config/routes.oas.json mounted at /api) and GraphQL endpoints.
import baseConfig from "./zudoku.base.js";

const config: ZudokuConfig = {
  extends: [baseConfig],
  site: {
    title: "My Developer Portal",
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
  navigation: [
    {
      type: "category",
      label: "Documentation",
      items: [
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
              to: "/api",
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
              to: "https://zuplo.com/docs/dev-portal/introduction",
            },
            {
              type: "link",
              label: "Developer Portal Docs",
              to: "https://zuplo.com/docs/dev-portal/introduction",
            },
          ],
        },
      ],
    },
    {
      type: "link",
      to: "/api",
      label: "API Reference",
    },
  ],
  redirects: [{ from: "/", to: "/introduction" }],
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
  protectedRoutes: {
    "/settings/api-keys": ({ reasonCode }) => {
      return reasonCode.FORBIDDEN;
    },
  },
};

export default config;
