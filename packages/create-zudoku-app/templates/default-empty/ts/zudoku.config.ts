import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  apis: {
    type: "url",
    input: `https://api.example.com/openapi.json`,
    path: "/api",
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
};

export default config;
