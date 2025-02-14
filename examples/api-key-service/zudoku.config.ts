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
    { id: "documentation/introduction", label: "Introduction" },
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
  apis: {
    type: "file",
    input: "schema/simple.json",
    navigationId: "api",
  },
};

export default config;
