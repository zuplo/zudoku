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
      label: "Rick & Morty API",
      type: "link",
      to: apiReference,
    },
  ],
  redirects: [{ from: "/", to: apiReference }],
  apis: {
    type: "file",
    input: "./openapi.yaml",
    path: apiReference,
  },
};

export default config;
