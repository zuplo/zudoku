import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  page: {
    pageTitle: "",
    logoUrl: "https://cdn.zudoku.dev/logos/icon.svg",
    logo: {
      src: {
        light: "https://cdn.zudoku.dev/logos/zudoku-logo-full-light.svg",
        dark: "https://cdn.zudoku.dev/logos/zudoku-logo-full-dark.svg",
      },
      width: "130px",
    },
  },
  metadata: {
    title: "%s | Zudoku",
  },
  theme: {
    light: {
      primary: "316 100% 50%",
      primaryForeground: "360 100% 100%",
    },
    dark: {
      primary: "316 100% 50%",
      primaryForeground: "360 100% 100%",
    },
  },
  authentication: {
    type: "clerk",
    clerkPubKey: "pk_test_ZGVlcC1vd2wtNDAuY2xlcmsuYWNjb3VudHMuZGV2JA",
  },
  topNavigation: [
    { id: "documentation", label: "Documentation" },
    { id: "api", label: "Rick & Morty API" },
  ],
  sidebar: {
    documentation: ["introduction", "installation"],
  },
  redirects: [
    { from: "/", to: "/documentation/introduction", replace: true },
    {
      from: "/documentation",
      to: "/documentation/introduction",
      replace: true,
    },
  ],
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
