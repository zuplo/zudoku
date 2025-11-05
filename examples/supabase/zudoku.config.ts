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
      to: "/api",
      label: "Rick & Morty API",
    },
  ],
  protectedRoutes: ["/documentation/installation", "/api/*"],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  docs: {
    files: "/pages/**/*.mdx",
  },
  authentication: {
    type: "supabase",
    provider: "github",
    supabaseUrl: "https://xgipcjfbwhxxmnmbgang.supabase.co",
    supabaseKey: "sb_publishable_Owrp_sEczaIw9BthUQ8gAw_HDelnNHO",
  },
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    path: "api",
  },
};

export default config;
