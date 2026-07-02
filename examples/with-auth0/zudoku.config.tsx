import { createPath, joinUrl, type ZudokuConfig } from "zudoku";
import VerifiedPage from "./src/VerifiedPage";

const apiReference = createPath("/api");

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
      items: ["documentation/introduction", "documentation/installation"],
    },
    {
      type: "link",
      to: apiReference,
      label: "Rick & Morty API",
    },
    {
      label: "Email Verification",
      type: "custom-page",
      path: "/verified",
      element: <VerifiedPage />,
    },
  ],

  protectedRoutes: [
    "/documentation/installation",
    joinUrl(apiReference, "*"),
    "/verified",
  ],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  docs: {
    files: "/pages/**/*.mdx",
  },
  // Authentication configuration
  authentication: {
    type: "auth0",
    domain: "zuplo-samples.us.auth0.com",
    clientId: "kWQs12Q9Og4w6zzI82qJSa3klN1sMtvz",
    audience: "https://api.example.com/",
  },
  apis: {
    type: "file",
    input: "./openapi.json",
    path: apiReference,
  },
};

export default config;
