import { graphqlPlugin } from "@zudoku/plugin-graphql";
import { createPath, type ApiIdentityPlugin, type ZudokuConfig } from "zudoku";

const restApi = createPath("/api");
const graphqlOasApi = createPath("/graphql-api");
const graphqlDefault = createPath("/graphql/default");
const graphqlDev = createPath("/graphql/dev");
const graphqlAnalytics = createPath("/graphql/analytics");

// Demo identities so the playground auth picker shows in this example
const demoApiIdentityPlugin: ApiIdentityPlugin = {
  getIdentities: async () => [
    {
      id: "test-key",
      label: "Test API Key",
      authorizeRequest: (request: Request) => {
        request.headers.set("Authorization", "Bearer demo-test-key");
        return request;
      },
      authorizationFields: { headers: ["Authorization"] },
    },
    {
      id: "staging-key",
      label: "Staging API Key",
      authorizeRequest: (request: Request) => {
        request.headers.set("Authorization", "Bearer demo-staging-key");
        return request;
      },
      authorizationFields: { headers: ["Authorization"] },
    },
  ],
};

const config: ZudokuConfig = {
  site: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  navigation: [
    {
      label: "Our APIs",
      type: "category",
      items: [
        { label: "Getting Started", type: "doc", file: "home" },
        {
          type: "category",
          label: "REST",
          collapsed: false,
          items: [
            { label: "E-Commerce REST API", type: "link", to: restApi },
            { label: "Blog REST API", type: "link", to: restApi },
          ],
        },
        {
          type: "category",
          label: "GraphQL",
          collapsed: false,
          items: [
            {
              label: "Developer API",
              type: "link",
              to: graphqlDev,
              stack: true,
            },
            {
              label: "Analytics API",
              type: "link",
              to: graphqlAnalytics,
              stack: true,
            },
          ],
        },
        {
          type: "category",
          label: "AI (MCP server)",
          collapsed: false,
          items: [
            { label: "Docs", type: "link", to: "/mcp" },
            { label: "Development", type: "link", to: "/claude" },
            { label: "Deployment", type: "link", to: "/claude" },
            { label: "Analytics", type: "link", to: "/claude" },
            { label: "Monetization", type: "link", to: "/claude" },
          ],
        },
      ],
    },
    { label: "REST API", type: "link", to: restApi },
    { label: "GraphQL OAS", type: "link", to: graphqlOasApi },
  ],
  redirects: [{ from: "/", to: graphqlDefault }],
  theme: {
    registryUrl: "https://tweakcn.com/r/themes/cmjgilzlg000404ju2wgs7uj9",
  },
  apis: [
    {
      type: "file",
      input: "./openapi.json",
      path: restApi,
      options: {
        showInfoPage: false,
      },
    },
    {
      type: "file",
      input: "./openapi-graphql.json",
      path: graphqlOasApi,
      options: {
        showInfoPage: false,
      },
    },
  ],
  plugins: [
    demoApiIdentityPlugin,
    graphqlPlugin({
      type: "file",
      input: "./schema.graphql",
      path: graphqlDefault,
      options: {
        title: "E-Commerce GraphQL API",
        description:
          "A sample e-commerce API with products, orders, and user management.",
      },
    }),
    graphqlPlugin({
      type: "file",
      input: "./schema.graphql",
      path: graphqlDev,
      options: {
        title: "Developer GraphQL API",
        description:
          "A sample e-commerce API with products, orders, and user management.",
      },
    }),
    graphqlPlugin({
      type: "file",
      input: "./schema.graphql",
      path: graphqlAnalytics,
      options: {
        title: "Analytics GraphQL API",
        description:
          "A sample e-commerce API with products, orders, and user management.",
      },
    }),
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
