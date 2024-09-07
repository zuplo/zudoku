import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  redirects: [{ from: "/", to: "/documentation" }],
  topNavigation: [
    { id: "documentation", label: "Documentation" },
    { id: "api", label: "Rick & Morty API" },
  ],
  sidebar: {
    documentation: [
      {
        type: "category",
        label: "Get started",
        items: ["introduction", "installation"],
      },
    ],
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    navigationId: "api",
  },
};

export default config;
