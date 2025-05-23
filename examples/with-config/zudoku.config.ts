import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  page: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  topNavigation: [
    { id: "documentation", label: "Documentation" },
    { id: "api", label: "Rick & Morty API" },
  ],
  sidebar: {
    documentation: [
      {
        type: "category",
        label: "Get started",
        items: ["documentation/introduction", "documentation/installation"],
      },
    ],
  },
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    navigationId: "api",
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
