import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  basePath: "/your-repo",
  metadata: {
    favicon: "/favicon.svg",
  },
  site: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  navigation: [
    {
      type: "category",
      label: "Documentation",
      link: "introduction",
      items: ["introduction", "installation"],
    },
    {
      type: "link",
      to: "/api/rick-and-morty",
      label: "Rick & Morty API",
    },
  ],
  redirects: [{ from: "/", to: "/introduction" }],
  apis: {
    type: "file",
    input: "./openapi.json",
    path: "api/rick-and-morty",
  },
  defaults: {
    apis: {
      schemaDownload: {
        enabled: true,
      },
    },
  },
  docs: {
    files: "/pages/**/*.mdx",
    llms: {
      llmsTxt: true,
    },
  },
};

export default config;
