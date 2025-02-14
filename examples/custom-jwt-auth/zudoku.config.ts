import { type ZudokuConfig } from "zudoku";
import { MyApiKeyService } from "./src/MyApiKeyService";

const config: ZudokuConfig = {
  redirects: [
    {
      from: "/",
      to: "/documentation/introduction",
    },
  ],
  topNavigation: [
    { id: "documentation/introduction", label: "Documentation" },
    { id: "api", label: "Demo API" },
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
  authentication: {
    type: "auth0",
    domain: "zuplo-samples.us.auth0.com",
    clientId: "kWQs12Q9Og4w6zzI82qJSa3klN1sMtvz",
  },
  apiKeys: MyApiKeyService,
  plugins: [
    {
      getIdentities: async () => [
        {
          id: "api",
          label: "Demo API",
          authorizeRequest: (request) => {
            return request;
          },
        },
      ],
    },
  ],
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    navigationId: "api",
  },
};

export default config;
