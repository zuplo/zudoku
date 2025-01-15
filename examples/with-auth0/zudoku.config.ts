import { type ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  topNavigation: [
    { id: "documentation", label: "Documentation" },
    { id: "api", label: "Rick & Morty API", display: "auth" },
  ],
  sidebar: {
    documentation: [
      {
        type: "category",
        label: "Get started",
        items: ["documentation/introduction", "documentation/installation"],
      },
    ],
  },
  protectedRoutes: [
    "/documentation/installation",
    "/api/**",
  ],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  docs: {
    files: "/pages/**/*.mdx",
  },
  // Authentication configuration
  authentication: {
    type: "auth0",
    domain: "zuplo-samples.us.auth0.com",
    clientId: "kWQs12Q9Og4w6zzI82qJSa3klN1sMtvz",
    audience: "https://accuweather-poc.pages.dev/",
  },
  apiKeys: {
    enabled: true,
    endpoint: "https://zudoku-customer-main-b36fa2f.d2.zuplo.dev",
  },
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    navigationId: "api",
  },
};

export default config;
