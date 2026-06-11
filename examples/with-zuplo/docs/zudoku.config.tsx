import type { ZudokuConfig } from "zudoku";

// In Zuplo mode the `@zuplo/zudoku` dependency is applied automatically: it
// sets up an OpenAPI reference for each OpenAPI file in ../config and a
// GraphQL reference for each GraphQL endpoint, enriched with the project's
// policies. Add `zuploPlugin()` to `plugins` yourself only to pass options.
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
