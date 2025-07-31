import type { ZudokuConfig } from "zudoku";
import { createApiIdentityPlugin } from "zudoku/plugins";

const config: ZudokuConfig = {
  site: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  redirects: [
    {
      from: "/",
      to: "/documentation/introduction",
    },
  ],
  navigation: [
    {
      type: "category",
      label: "Documentation",
      items: ["documentation/introduction"],
    },
    {
      type: "link",
      to: "/api",
      label: "Rick & Morty API",
    },
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
  authentication: {
    type: "auth0",
    domain: "zuplo-samples.us.auth0.com",
    clientId: "kWQs12Q9Og4w6zzI82qJSa3klN1sMtvz",
  },
  plugins: [
    createApiIdentityPlugin({
      getIdentities: async (context) => [
        {
          id: "api",
          label: "Demo Key",
          authorizeRequest: async (request) => {
            const token = await context.authentication?.getAccessToken();
            if (!token) {
              throw new Error("No token found");
            }
            request.headers.set("Authorization", `Bearer ${token}`);
            return request;
          },
        },
      ],
    }),
  ],
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    path: "api",
  },
};

export default config;
