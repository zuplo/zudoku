import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  page: {
    banner: {
      message: (
        <div className="text-center">
          We're announcing 🧑‍🚀 inter-galactic shipping ✨ for 3025!
        </div>
      ),
      dismissible: true,
    },
  },
  topNavigation: [
    { id: "general", label: "General" },
    { id: "api-shipments", label: "Shipments API" },
    { id: "catalog", label: "All APIs" },
  ],
  redirects: [{ from: "/", to: "/general" }],
  sidebar: {
    general: ["general", "global", "interstellar", "intergalactic"],
  },
  catalogs: {
    navigationId: "catalog",
    label: "API Catalog",
  },
  authentication: {
    type: "clerk",
    clerkPubKey: "pk_test_dG9sZXJhbnQtaG9ybmV0LTQ2LmNsZXJrLmFjY291bnRzLmRldiQ",
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
      input: [
        "./schema/label-v3.json",
        "./schema/label-v2.json",
        "./schema/label-v1.json",
      ],
      navigationId: "api-label",
      categories: [{ label: "General", tags: ["Labels"] }],
    },
    {
      type: "file",
      input: "./schema/webhooks.json",
      navigationId: "api-webhooks",
      categories: [{ label: "General", tags: ["Developer"] }],
    },
    {
      type: "file",
      input: "./schema/interplanetary.json",
      navigationId: "api-interplanetary",
      categories: [{ label: "Interplanetary", tags: ["Interplanetary"] }],
    },
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
  theme: {
    light: {
      primary: "#FF00BD",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      primary: "#E20074",
      primaryForeground: "#FFFFFF",
    },
  },
};

export default config;
