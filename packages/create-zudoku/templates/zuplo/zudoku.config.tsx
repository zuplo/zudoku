// Uncomment the import below to enable Zuplo monetization (pricing, checkout,
// subscriptions). See: https://zuplo.com/docs/articles/monetization
// import { zuploMonetizationPlugin } from "@zuplo/zudoku-plugin-monetization";
// Uncomment the import below to document a GraphQL API (schema reference docs
// and an interactive playground).
// import { graphqlPlugin } from "@zudoku/plugin-graphql";
import type { ZudokuConfig } from "zudoku";

/**
 * Developer Portal Configuration
 * For more information, see:
 * https://zuplo.com/docs/dev-portal/zudoku/configuration/overview
 */
const config: ZudokuConfig = {
  site: {
    title: "My Developer Portal",
    logo: {
      src: {
        light: "https://cdn.zuplo.com/assets/my-dev-portal-light.svg",
        dark: "https://cdn.zuplo.com/assets/my-dev-portal-dark.svg",
      },
    },
  },
  metadata: {
    title: "Developer Portal",
    description: "Developer Portal",
  },
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
            {
              type: "doc",
              file: "introduction",
            },
            {
              type: "doc",
              file: "markdown",
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
  redirects: [{ from: "/", to: "/api" }],
  apis: [
    {
      type: "file",
      input: "../config/routes.oas.json",
      path: "api",
    },
  ],
  authentication: {
    // IMPORTANT: This is a demo Auth0 configuration.
    // In a real application, you should replace these values with your own
    // identity provider's configuration.
    // This configuration WILL NOT WORK with custom domains.
    // For more information, see:
    // https://zuplo.com/docs/dev-portal/zudoku/configuration/authentication
    type: "auth0",
    domain: "auth.zuplo.site",
    clientId: "f8I87rdsCRo4nU2FHf0fHVwA9P7xi7Ml",
    audience: "https://api.example.com/",
  },
  apiKeys: {
    enabled: true,
  },
  // Uncomment to enable monetization. Don't forget to also uncomment the
  // `zuploMonetizationPlugin` import at the top of this file.
  // plugins: [zuploMonetizationPlugin()],
  //
  // Uncomment to document a GraphQL API. Don't forget to also uncomment the
  // `graphqlPlugin` import at the top of this file. To enable this alongside
  // another plugin, place both inside a single `plugins: [...]` array.
  //
  // `schema` is introspected at build time to generate the reference docs.
  // The interactive playground sends operations to your Zuplo gateway's
  // `/graphql` route automatically.
  // plugins: [
  //   graphqlPlugin({
  //     schema: "https://your-gateway.zuplo.app/graphql",
  //     path: "graphql",
  //   }),
  // ],
};

export default config;
