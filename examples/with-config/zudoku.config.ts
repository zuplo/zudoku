import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
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
        collapsed: true,
      },
    ],
  },
  redirects: [{ from: "/", to: "/documentation" }],
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    navigationId: "api",
    defaultCollapsed: true,
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
