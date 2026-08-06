import { createPath, joinUrl, type ZudokuConfig } from "zudoku";

const rickAndMortyApi = createPath("/api/rick-and-morty");
const adyenBalanceApi = createPath("/api/adyen-balance");

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
      to: rickAndMortyApi,
      label: "Rick & Morty API",
    },
    {
      type: "link",
      to: joinUrl(adyenBalanceApi, "v2"),
      label: "Versioned API",
    },
  ],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  apis: [
    {
      type: "file",
      input: "./openapi.json",
      path: rickAndMortyApi,
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
      path: adyenBalanceApi,
    },
  ],
  defaults: {
    apis: {
      schemaDownload: {
        enabled: true,
      },
    },
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
