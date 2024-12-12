import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  topNavigation: [
    { id: "general", label: "General" },
    { id: "catalog", label: "APIs" },
  ],
  redirects: [{ from: "/", to: "/general" }],
  sidebar: {
    general: [
      "general",
      { label: "Configuration", id: "general/configuration" },
      { label: "Authentication", id: "general/authentication" },
      { label: "Search", id: "general/search" },
    ],
  },
  catalog: {
    navigationId: "catalog",
    label: "Foo",
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
      input: "./schema/logistics.json",
      navigationId: "api-logistics",
      categories: [{ label: "General", tags: ["Operational"] }],
    },
    {
      type: "file",
      input: "./schema/destructive.json",
      navigationId: "api-destructive",
      categories: [{ label: "General", tags: ["End-User"] }],
    },
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
