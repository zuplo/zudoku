import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  topNavigation: [
    { id: "documentation", label: "Documentation" },
    { id: "api", label: "API Reference" },
  ],
  sidebar: {
    documentation: [
      {
        type: "category",
        label: "Overview",
        items: ["example", "other-example"],
      },
    ],
  },
  redirects: [
    { from: "/", to: "/documentation" }
  ],
  apis: {
    type: "url",
    input: "https://api.example.com/openapi.json", // Enter the URL for your OpenAPI document
    //input: "https://rickandmorty.zuplo.io/openapi.json" // ...or, uncomment this line to see an example
    navigationId: "api",
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
};

export default config;