import type {
  ApiIdentity,
  ApiIdentityPlugin,
  ZudokuConfig,
  ZudokuContext,
} from "zudoku";
import { generateWebhookCodeSnippet } from "./src/CodeSnippetGenerator";
import { Landingpage } from "./src/Landingpage";

export class CosmoCargoApiIdentityPlugin implements ApiIdentityPlugin {
  async getIdentities(context: ZudokuContext) {
    if (!context.getAuthState().isAuthenticated) {
      return [];
    }

    return [
      {
        label: `Unlimited Subscription`,
        id: "UNLNTD",
        authorizeRequest: async (request: Request) => {
          request.headers.set("Authorization", `Bearer 123123`);

          return request;
        },
        authorizationFields: {
          headers: ["Authorization"],
        },
      },
    ] satisfies ApiIdentity[];
  }
}

const config: ZudokuConfig = {
  metadata: {
    title: "Cosmo Cargo Inc.",
  },
  docs: {
    publishMarkdown: true,
    llms: { llmsTxt: true, llmsTxtFull: true },
  },
  site: {
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
  plugins: [new CosmoCargoApiIdentityPlugin()],
  protectedRoutes: ["/only-members"],
  navigation: [
    {
      type: "custom-page",
      path: "/",
      element: <Landingpage />,
    },
    {
      type: "category",
      label: "Documentation",
      icon: "book-open",
      items: [
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
        {
          type: "category",
          icon: "shield",
          label: "Premium Guides",
          display: "auth",
          items: [
            {
              type: "doc",
              file: "member-benefits",
              label: "Member Benefits",
              icon: "user-plus",
            },
            {
              type: "doc",
              file: "premium-fleet",
              path: "premium-fleet-services",
              label: "Premium Fleet Services",
              icon: "trophy",
            },
          ],
        },
      ],
    },
    {
      type: "link",
      icon: "ship",
      to: "/api-shipments/shipment-management",
      label: "Shipments",
    },
    {
      type: "link",
      icon: "square-library",
      to: "/catalog",
      label: "API Catalog",
    },
    {
      type: "custom-page",
      path: "/only-members",
      label: "Only members",
      display: "auth",
      element: <div>Only members are allowed in here.</div>,
    },
  ],
  catalogs: {
    path: "catalog",
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
      schemaDownload: {
        enabled: true,
      },
    },
  },
  search: {
    type: "pagefind",
  },
  apis: [
    {
      type: "file",
      input: "./schema/shipments.json",
      path: "api-shipments",
      categories: [{ label: "General", tags: ["Shipments"] }],
      options: {
        transformExamples: ({ content, auth }) => {
          if (!auth.isAuthenticated) {
            return content;
          }
          return content.map((c) => ({
            ...c,
            examples: c.examples?.map((e) => {
              if (e.name === "domestic" || e.name === "simple") {
                return {
                  ...e,
                  value: {
                    ...e.value,
                    recipientEmail: auth?.profile?.email,
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
        {
          input: "./schema/label-v3.json",
          path: "latest",
          label: "Latest (3.0.0)",
        },
        { input: "./schema/label-v2.json" },
        { input: "./schema/label-v1.json" },
      ],
      path: "/catalog/api-label",
      categories: [{ label: "General", tags: ["Labels"] }],
    },
    {
      type: "file",
      input: "./schema/webhooks.json",
      path: "/catalog/api-webhooks",
      categories: [{ label: "General", tags: ["Developer"] }],
      options: {
        supportedLanguages: [
          { value: "js", label: "JavaScript" },
          { value: "python", label: "Python" },
          { value: "java", label: "Java" },
        ],
        generateCodeSnippet: ({
          selectedLang,
          selectedServer,
          operation,
          example,
        }) => {
          return generateWebhookCodeSnippet(
            selectedLang,
            selectedServer,
            operation.operationId,
            example,
          );
        },
      },
    },
    {
      type: "file",
      input: "./schema/interplanetary.json",
      path: "/catalog/api-interplanetary",
      categories: [{ label: "Interplanetary", tags: ["Interplanetary"] }],
    },
    {
      type: "file",
      input: "./schema/tracking-v1.json",
      path: "/catalog/api-tracking",
      categories: [{ label: "General", tags: ["Tracking"] }],
    },
    {
      type: "file",
      input: "./schema/ai-cargo.json",
      path: "/catalog/api-ai-cargo",
      categories: [
        {
          label: "AI & Automation",
          tags: ["MCP Integration", "AI Optimization"],
        },
      ],
    },
    {
      type: "file",
      input: "./schema/cargo-containers.json",
      path: "/catalog/api-cargo-containers",
      categories: [{ label: "General", tags: ["Containers", "Booking"] }],
    },
  ],
  theme: {
    light: {
      background: "0 0% 100%",
      foreground: "20 14.3% 4.1%",
      card: "#fff",
      cardForeground: "#262626",
      popover: "0 0% 100%",
      popoverForeground: "20 14.3% 4.1%",
      primary: "#f4bf32",
      primaryForeground: "#0f1719",
      secondary: "60 4.8% 95.9%",
      secondaryForeground: "24 9.8% 10%",
      muted: "#f5f5f5",
      mutedForeground: "var(--color-zinc-500)",
      accent: "60 4.8% 95.9%",
      accentForeground: "24 9.8% 10%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "60 9.1% 97.8%",
      border: "20 5.9% 90%",
      input: "20 5.9% 90%",
      ring: "oklch(0.708 0 0)",
    },
    dark: {
      background: "#1a1a18",
      foreground: "60 9.1% 97.8%",
      card: "#151518",
      cardForeground: "60 9.1% 97.8%",
      popover: "20 14.3% 4.1%",
      popoverForeground: "60 9.1% 97.8%",
      primary: "#f4bf32",
      primaryForeground: "#0f1719",
      secondary: "12 6.5% 15.1%",
      secondaryForeground: "60 9.1% 97.8%",
      muted: "#222",
      mutedForeground: "var(--color-zinc-400)",
      accent: "12 6.5% 15.1%",
      accentForeground: "60 9.1% 97.8%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "60 9.1% 97.8%",
      border: "hsl(12deg 4.75% 24.84%)",
      input: "hsl(12deg 4.88% 29.61%)",
      ring: "35.5 91.7% 32.9%",
    },
  },
};

export default config;
