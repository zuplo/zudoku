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
      link: "documentation/installation",
      items: [
        {
          type: "category",
          label: "Get started",
          items: ["documentation/introduction", "documentation/installation"],
        },
      ],
    },
    {
      type: "link",
      to: "/api/rick-and-morty",
      label: "Rick & Morty API",
    },
    {
      type: "link",
      to: "/api/adyen-balance/v2",
      label: "Versioned API",
    },
  ],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  apis: [
    {
      type: "url",
      input: "https://rickandmorty.zuplo.io/openapi.json",
      path: "api/rick-and-morty",
    },
    {
      type: "url",
      input: [
        {
          path: "v2",
          label: "v2 (latest)",
          input:
            "https://api.apis.guru/v2/specs/adyen.com/BalancePlatformService/2/openapi.json",
        },
        {
          path: "v1",
          label: "v1",
          input:
            "https://api.apis.guru/v2/specs/adyen.com/BalancePlatformService/1/openapi.json",
        },
      ],
      path: "api/adyen-balance",
    },
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
