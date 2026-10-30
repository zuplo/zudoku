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
      type: "category",
      label: "Documentation",
      link: "documentation/introduction",
      items: [
        {
          type: "category",
          label: "Get started",
          items: ["documentation/introduction"],
        },
      ],
    },
    {
      type: "link",
      to: "/api",
      label: "Pet Store API",
    },
  ],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  apis: {
    type: "url",
    input: "https://petstore3.swagger.io/api/v3/openapi.json",
    path: "api",
  },
  authentication: {
    type: "auth0",
    domain: "zuplo-samples.us.auth0.com",
    clientId: "kWQs12Q9Og4w6zzI82qJSa3klN1sMtvz",
    audience: "https://api.example.com/",
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
