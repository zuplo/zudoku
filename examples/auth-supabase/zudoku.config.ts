import { createPath, type ZudokuConfig } from "zudoku";

const apiReference = createPath("/api");

const config: ZudokuConfig = {
  site: {
    logo: {
      src: {
        light: "https://cdn.zuplo.com/static/logos/zudoku-light.svg",
        dark: "https://cdn.zuplo.com/static/logos/zudoku-dark.svg",
      },
      alt: "Zudoku",
      width: 130,
    },
  },
  theme: {
    registryUrl: "https://tweakcn.com/r/themes/supabase.json",
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
      to: apiReference,
      label: "Rick & Morty API",
    },
  ],
  protectedRoutes: ["/documentation/installation", `${apiReference}/*`],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  docs: {
    files: "/pages/**/*.mdx",
  },
  authentication: {
    type: "supabase",
    providers: ["github", "google"],
    supabaseUrl: "https://xgipcjfbwhxxmnmbgang.supabase.co",
    supabaseKey: "sb_publishable_Owrp_sEczaIw9BthUQ8gAw_HDelnNHO",
  },
  apis: {
    type: "file",
    input: "./openapi.json",
    path: apiReference,
  },
};

export default config;
