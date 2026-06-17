// Uncomment the import below to enable Zuplo monetization (pricing, checkout,
// subscriptions). See: https://zuplo.com/docs/articles/monetization
// import { zuploMonetizationPlugin } from "@zuplo/zudoku-plugin-monetization";
// Uncomment the import below to document a GraphQL API (schema reference docs
// and an interactive playground).
// import { graphqlPlugin } from "@zudoku/plugin-graphql";
import { createPath, type ZudokuConfig } from "zudoku";

// Define the path once and reference it from both the navigation link and the
// API plugin below so the two cannot drift apart.
const apiReference = createPath("/api");

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
      to: apiReference,
      label: "API Reference",
    },
  ],
  redirects: [{ from: "/", to: apiReference }],
  apis: [
    {
      type: "file",
      input: "../config/routes.oas.json",
      path: apiReference,
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
  // plugins: [
  //   graphqlPlugin({
  //     schema: "https://api.example.com/graphql",
  //     path: "graphql",
  //     options: {
  //       title: "My GraphQL API",
  //       description: "Explore the schema and try queries in the playground.",
  //     },
  //   }),
  // ],
};

export default config;
