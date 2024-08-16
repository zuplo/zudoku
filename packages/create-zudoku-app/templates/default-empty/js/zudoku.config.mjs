import navigation from "./navigation";

/** @type {import('zudoku').ZudokuConfig} */
const config = {
  page: {
    pageTitle: "%s | Dev Portal",
    logo: "/icon.svg",
  },
  metadata: {
    title: "%s | My Portal",
  },
  navigation,
  apis: {
    type: "url",
    input: `https://api.example.com/openapi.json`,
    path: "/api",
  },
  docs: {
    files: "/pages/**/*.md?x",
  },
};

export default config;
