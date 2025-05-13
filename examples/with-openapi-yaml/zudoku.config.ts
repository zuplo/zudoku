import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  navigation: [{ label: "Rick & Morty API", type: "link", href: "api" }],
  redirects: [{ from: "/", to: "/api" }],
  apis: {
    type: "file",
    input: "./openapi.yaml",
    path: "api",
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
