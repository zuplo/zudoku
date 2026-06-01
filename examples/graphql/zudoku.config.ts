import { graphqlPlugin } from "@zudoku/plugin-graphql";
import type { ZudokuConfig } from "zudoku";

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
            { label: "E-Commerce REST API", type: "link", to: "/api" },
            { label: "Blog REST API", type: "link", to: "/api" },
          ],
        },
        {
          type: "category",
          label: "GraphQL",
          collapsed: false,
          items: [
            { label: "Developer API", type: "link", to: "/dev-graphql" },
            { label: "Analytics API", type: "link", to: "/analytics-graphql" },
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
    { label: "GraphQL API", type: "link", to: "/graphql" },
    { label: "REST API", type: "link", to: "/api" },
  ],
  redirects: [{ from: "/", to: "/graphql" }],
  theme: {
    registryUrl: "https://tweakcn.com/r/themes/cmjgilzlg000404ju2wgs7uj9",
  },
  apis: [
    {
      type: "file",
      input: "./openapi.json",
      path: "api",
      options: {
        showInfoPage: false,
      },
    },
  ],
  plugins: [
    graphqlPlugin({
      type: "file",
      input: "./schema.graphql",
      path: "graphql",
      options: {
        title: "E-Commerce GraphQL API",
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
