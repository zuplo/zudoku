import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  site: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  navigation: [{ label: "Rick & Morty API", type: "link", to: "/api" }],
  redirects: [{ from: "/", to: "/api" }],
  apis: {
    type: "file",
    input: "./openapi.json",
    path: "api",
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
