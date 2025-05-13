import { type ZudokuConfig } from "zudoku";
import { MyApiKeyService } from "./src/MyApiKeyService";

const config: ZudokuConfig = {
  page: {
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
    { id: "documentation/introduction", label: "Introduction" },
    { href: "api", label: "Demo API", type: "link" },
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
    path: "api",
  },
};

export default config;
