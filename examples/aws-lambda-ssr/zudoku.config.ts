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
          items: ["documentation/introduction", "documentation/protected"],
        },
      ],
    },
    {
      type: "link",
      to: "/api",
      label: "Protected Pet Store API",
    },
  ],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  apis: {
    type: "file",
    input: "./protected-api.yaml",
    path: "api",
  },
  authentication: {
    type: "auth0",
    domain: "zuplo-samples.us.auth0.com",
    clientId: "kWQs12Q9Og4w6zzI82qJSa3klN1sMtvz",
    audience: "https://api.example.com/",
  },
  protectedRoutes: ["/documentation/protected", "/api/*"],
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
