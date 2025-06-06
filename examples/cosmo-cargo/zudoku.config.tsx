import type { ZudokuConfig, ZudokuContext } from "zudoku";
import { type ApiIdentity, type ApiIdentityPlugin } from "zudoku";
import { Landingpage } from "./src/Landingpage";

export class CosmoCargoApiIdentityPlugin implements ApiIdentityPlugin {
  async getIdentities(context: ZudokuContext) {
    return [
      {
        label: `Unlimited Subscription`,
        id: "UNLNTD",
        authorizeRequest: async (request: Request) => {
          request.headers.set("Authorization", `Bearer 123123`);

          return request;
        },
      },
    ] satisfies ApiIdentity[];
  }
}

const config: ZudokuConfig = {
  metadata: {
    title: "Cosmo Cargo Inc.",
  },
  page: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      width: 130,
      alt: "Cosmo Cargo Inc.",
    },
    banner: {
      message: (
        <div className="text-center">
          We're announcing 🧑‍🚀 inter-galactic shipping ✨ for 3025!
        </div>
      ),
      dismissible: true,
    },
    footer: {
      columns: [
        {
          title: "Product",
          links: [
            { label: "Features", href: "https://zudoku.dev" },
            {
              label: "Docs",
              href: "https://zudoku.dev/docs/?utm_source=cosmo-cargo",
            },
          ],
        },
        {
          title: "Company",
          links: [
            { label: "About", href: "https://zuplo.com/about" },
            { label: "Blog", href: "https://zuplo.com/blog" },
            { label: "Careers", href: "https://zuplo.com/careers" },
          ],
        },
        {
          title: "Resources",
          links: [
            { label: "API Reference", href: "/" },
            { label: "Status", href: "/" },
            { label: "Support", href: "/" },
          ],
        },
        {
          title: "Legal",
          links: [
            { label: "Privacy", href: "/" },
            { label: "Terms", href: "/" },
            { label: "Security", href: "/" },
          ],
        },
      ],
      social: [
        {
          href: "https://github.com/zuplo/zudoku",
          icon: "github",
        },
        {
          href: "https://twitter.com/zuplo",
          icon: "x",
        },
        {
          href: "https://discord.zudoku.dev",
          icon: "discord",
        },
      ],
      copyright: `© ${new Date().getFullYear()} Zuplo, Inc. All rights reserved.`,
      logo: {
        src: {
          light: "https://cdn.zudoku.dev/logos/zudoku-logo-full-light.svg",
          dark: "https://cdn.zudoku.dev/logos/zudoku-logo-full-dark.svg",
        },
        alt: "Zudoku by Zuplo",
        width: 120,
      },
    },
  },
  protectedRoutes: ["/only-members"],
  topNavigation: [
    { id: "documentation", label: "Documentation" },
    { id: "api-shipments", label: "Shipments API" },
    { id: "catalog", label: "API Catalog" },
  ],
  sidebar: {
    documentation: [
      "documentation",
      {
        type: "category",
        icon: "telescope",
        collapsed: false,
        label: "Space Operations",
        items: ["shipping-process", "tracking"],
      },
      "global",
      {
        type: "category",
        icon: "library-big",
        label: "Shipping Guides",
        items: ["interstellar", "intergalactic"],
      },
    ],
  },
  catalogs: {
    navigationId: "catalog",
    label: "API Catalog",
  },
  authentication: {
    type: "clerk",
    clerkPubKey: "pk_test_dG9sZXJhbnQtaG9ybmV0LTQ2LmNsZXJrLmFjY291bnRzLmRldiQ",
    redirectToAfterSignIn: "/documentation",
    redirectToAfterSignUp: "/documentation",
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
    { path: "/", element: <Landingpage /> },
    { path: "/only-members", element: <div>Only members</div> },
  ],
  plugins: [new CosmoCargoApiIdentityPlugin()],
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
    {
      type: "file",
      input: "./schema/tracking-v1.json",
      navigationId: "api-tracking",
      categories: [{ label: "General", tags: ["Tracking"] }],
    },
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
  theme: {
    light: {
      background: "#ffffff",
      foreground: "#0c0a09",
      card: "#ffffff",
      cardForeground: "#0c0a09",
      popover: "#ffffff",
      popoverForeground: "#0c0a09",
      primary: "#f4bf32",
      primaryForeground: "#0f1719",
      secondary: "#f5f5f4",
      secondaryForeground: "#1c1917",
      muted: "#f5f5f4",
      mutedForeground: "#78716c",
      accent: "#f5f5f4",
      accentForeground: "#1c1917",
      destructive: "#ef4444",
      destructiveForeground: "#fafaf9",
      border: "#e7e5e4",
      input: "#e7e5e4",
      ring: "#0c0a09",
    },
    dark: {
      background: "#161619",
      foreground: "#fafaf9",
      card: "#212129",
      cardForeground: "#fafaf9",
      popover: "#2f2f39",
      popoverForeground: "#fafaf9",
      primary: "#f4bf32",
      primaryForeground: "#141418",
      secondary: "#242428",
      secondaryForeground: "#fafaf9",
      muted: "#242428",
      mutedForeground: "#9591a9",
      accent: "#4a4a5c",
      accentForeground: "#fafaf9",
      destructive: "#9e2648",
      destructiveForeground: "#fafaf9",
      border: "#323341",
      input: "#3c3d4c",
      ring: "#3f3f46",
    },
  },
};

export default config;
