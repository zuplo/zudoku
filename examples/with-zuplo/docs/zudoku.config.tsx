import type { ZudokuConfig } from "zudoku";
import { enableMonetization } from "zudoku/plugins/zuplo-monetization";

const config: ZudokuConfig = {
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
  apis: {
    type: "file",
    input: "../config/routes.oas.json",
    path: "/api",
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

export default enableMonetization(config, {
  environmentName: "zudoku-monetization-main-b2d8e04",
});
