import type { ZudokuConfig } from "zudoku";
import { ApiIdentity, ApiIdentityPlugin } from "zudoku";

export class ShipHappensApiIdentityPlugin implements ApiIdentityPlugin {
  async getIdentities() {
    return [
      {
        label: `Unlimited Subscription`,
        id: "UNLNTD",
        authorizeRequest: (request: Request) => {
          request.headers.set("X-Authorization", `Bearer 1234567890`);
          return request;
        },
      },
    ] satisfies ApiIdentity[];
  }
}

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
    { id: "catalog", label: "API Catalog" },
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
      primary: "#ffb703",
      primaryForeground: "#000",
    },
    dark: {
      primary: "#ffb703",
      primaryForeground: "#000",
    },
  },
  plugins: [new ShipHappensApiIdentityPlugin()],
};

export default config;
