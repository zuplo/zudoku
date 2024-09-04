import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  topNavigation: [{ id: "api", label: "Rick & Morty API" }],

  redirects: [{ from: "/", to: "/api" }],
  apis: {
    type: "file",
    input: "./openapi.yaml",
    navigationId: "api",
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
