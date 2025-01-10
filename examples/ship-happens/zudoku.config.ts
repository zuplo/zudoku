import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  topNavigation: [
    { id: "general", label: "General" },
    { id: "catalog", label: "APIs" },
  ],
  redirects: [{ from: "/", to: "/general" }],
  sidebar: {
    general: ["general", "global","interstellar"],
  },
  catalogs: {
    navigationId: "catalog",
    label: "API Catalog",
  },
  apis: [
    {
      type: "file", 
      input: "./schema/shipments.json",
      navigationId: "api-shipments",
      categories: [{ label: "General", tags: ["Shipments"] }],
    },
    {   
      type: "file",
      input: "./schema/label.json", 
      navigationId: "api-label",
      categories: [{ label: "General", tags: ["Labels"] }],
    },
    {
      type: "file",
      input: "./schema/webhooks.json",
      navigationId: "api-webhooks", 
      categories: [{ label: "General", tags: ["Webhooks"] }],
    },
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
  theme: {
    light: {
      primary: "#FF6F56",
      accent: "#cc5945",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      primary: "#FF6F56",
      accent: "#cc5945",
      primaryForeground: "#FFFFFF",
    }
  }
};

export default config;
