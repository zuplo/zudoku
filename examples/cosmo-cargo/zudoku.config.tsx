import type { ZudokuConfig } from "zudoku";
import { type ApiIdentity, type ApiIdentityPlugin } from "zudoku";

export class CosmoCargoApiIdentityPlugin implements ApiIdentityPlugin {
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
  protectedRoutes: ["/only-members"],
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
  defaults: {
    apis: {
      examplesLanguage: "js",
    },
  },
  search: {
    type: "pagefind",
  },
  customPages: [
    {
      path: "/only-members",
      element: <div>Only members</div>,
    },
  ],
  apis: [
    {
      type: "file",
      input: "./schema/shipments.json",
      navigationId: "api-shipments",
      categories: [{ label: "General", tags: ["Shipments"] }],
      options: {
        transformExamples: ({ content, auth }) => {
          if (!auth) {
            return content;
          }
          return content.map((c) => ({
            ...c,
            examples: c.examples?.map((e) => {
              if (e.name === "domestic") {
                return {
                  ...e,
                  value: {
                    recipientEmail: auth?.profile?.email,
                    ...e.value,
                  },
                };
              }
              return e;
            }),
          }));
        },
      },
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
      background: "0 0% 100%",
      foreground: "20 14.3% 4.1%",
      card: "0 0% 100%",
      cardForeground: "20 14.3% 4.1%",
      popover: "0 0% 100%",
      popoverForeground: "20 14.3% 4.1%",
      primary: "47.9 95.8% 53.1%",
      primaryForeground: "26 83.3% 14.1%",
      secondary: "60 4.8% 95.9%",
      secondaryForeground: "24 9.8% 10%",
      muted: "60 4.8% 95.9%",
      mutedForeground: "25 5.3% 44.7%",
      accent: "60 4.8% 95.9%",
      accentForeground: "24 9.8% 10%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "60 9.1% 97.8%",
      border: "20 5.9% 90%",
      input: "20 5.9% 90%",
      ring: "20 14.3% 4.1%",
    },
    dark: {
      background: "20 14.3% 4.1%",
      foreground: "60 9.1% 97.8%",
      card: "20 14.3% 4.1%",
      cardForeground: "60 9.1% 97.8%",
      popover: "20 14.3% 4.1%",
      popoverForeground: "60 9.1% 97.8%",
      primary: "47.9 95.8% 53.1%",
      primaryForeground: "26 83.3% 14.1%",
      secondary: "12 6.5% 15.1%",
      secondaryForeground: "60 9.1% 97.8%",
      muted: "12 6.5% 15.1%",
      mutedForeground: "24 5.4% 63.9%",
      accent: "12 6.5% 15.1%",
      accentForeground: "60 9.1% 97.8%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "60 9.1% 97.8%",
      border: "12 6.5% 15.1%",
      input: "12 6.5% 15.1%",
      ring: "35.5 91.7% 32.9%",
    },
  },
  plugins: [new CosmoCargoApiIdentityPlugin()],
};

export default config;
