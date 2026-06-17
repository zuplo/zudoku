import { createPath, type ZudokuConfig } from "zudoku";

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
  ],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  apis: {
    type: "file",
    input: "./openapi.json",
    path: apiReference,
  },
};

export default config;
