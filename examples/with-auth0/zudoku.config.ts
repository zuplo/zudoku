import type { ZudokuConfig } from "zudoku";
import navigation from "./navigation.js";

const config: ZudokuConfig = {
  page: {
    pageTitle: "",
    logoUrl: "https://cdn.zudoku.dev/logos/icon.svg",
    logo: {
      src: {
        light: "https://cdn.zudoku.dev/logos/zudoku-logo-full-light.svg",
        dark: "https://cdn.zudoku.dev/logos/zudoku-logo-full-dark.svg",
      },
      width: "130px",
    },
  },
  metadata: {
    title: "%s | Zudoku",
  },
  theme: {
    light: {
      primary: "316 100% 50%",
      primaryForeground: "360 100% 100%",
    },
    dark: {
      primary: "316 100% 50%",
      primaryForeground: "360 100% 100%",
    },
  },
  authentication: {
    type: "auth0",
    domain: "ntotten-test.us.auth0.com",
    clientId: "s2YqBXJ0BDykcaIOEW4cXXacaUntA1bm",
  },
  navigation,
  redirects: [{ from: "/", to: "/documentation", replace: true }],
  apiKeys: {
    enabled: true,
    endpoint: "https://zudoku-customer-main-b36fa2f.d2.zuplo.dev",
    // getConsumers: async () => {
    //   return [
    //     {
    //       name: "consumer1",
    //       apiKeys: [
    //         {
    //           key: "key_123",
    //           id: "id_123",
    //           createdOn: "2023-10-10",
    //         },
    //       ],
    //     },
    //   ];
    // },
  },
  apis: {
    type: "url",
    input: `https://blue-sloth-main-afc3428.d2.zuplo.dev/schemas/rewiring-america`,
    path: "/api",
    // server: "/__z/graphq",
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
