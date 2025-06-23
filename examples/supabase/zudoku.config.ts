import { type ZudokuConfig } from "zudoku";

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
    supabaseUrl: "https://vjqaastgcqotnutfzcyz.supabase.co",
    supabaseKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcWFhc3RnY3FvdG51dGZ6Y3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3ODkwNjIsImV4cCI6MjA1NzM2NTA2Mn0.bGuEFQRDf5E5VzSFIgxQxmZAA5mDvZuNJqWo2KHZ6NY",
  },
  apiKeys: {
    enabled: true,
  },
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    path: "api",
  },
};

export default config;
