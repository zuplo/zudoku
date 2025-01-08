import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  topNavigation: [
    { id: "general", label: "General" },
    { id: "catalog", label: "APIs" },
  ],
  redirects: [{ from: "/", to: "/general" }],
  sidebar: {
    general: ["general"],
  },
  catalogs: {
    navigationId: "catalog",
    label: "API Catalog",
  },
  apis: [
    {
      type: "file",
      input: "./schema/operational.json",
      navigationId: "api-operational",
      categories: [{ label: "General", tags: ["Operational"] }],
    },
    {
      type: "file",
      input: "./schema/entertainment.json",
      navigationId: "api-entertainment",
      categories: [{ label: "General", tags: ["End-User"] }],
    },
    {
      type: "file",
      input: ["./schema/logisticsV2.json", "./schema/logistics.json"],
      navigationId: "api-logistics",
      categories: [{ label: "Non-General", tags: ["Operational"] }],
    },
    {
      type: "file",
      input: "./schema/destructive.json",
      navigationId: "api-destructive",
      categories: [{ label: "Non-General", tags: ["End-User"] }],
    },
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
