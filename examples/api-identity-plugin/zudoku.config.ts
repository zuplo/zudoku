import { createPath, type ZudokuConfig } from "zudoku";
import { createApiIdentityPlugin } from "zudoku/plugins";

const apiReference = createPath("/api");

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
      to: apiReference,
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
            return await context.authentication?.signRequest(request);
          },
        },
      ],
    }),
  ],
  apis: {
    type: "file",
    input: "./openapi.json",
    path: apiReference,
  },
};

export default config;
