import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
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
      link: "documentation/installation",
      items: [
        {
          type: "category",
          label: "Get started",
          items: ["documentation/introduction", "documentation/installation"],
        },
      ],
    },
    {
      type: "link",
      to: "https://rickandmorty.zuplo.io",
      label: "Rick & Morty API",
    },
  ],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    path: "api",
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
  llmsTxt: {
    title: "Zudoku Example Documentation",
    description:
      "Sample documentation site showcasing Zudoku features and configuration options",
    customSections: [
      {
        title: "API Reference",
        items: [
          {
            title: "Rick & Morty API",
            url: "https://rickandmorty.zuplo.io",
            description: "External API for Rick and Morty data",
          },
        ],
      },
    ],
  },
};

export default config;
