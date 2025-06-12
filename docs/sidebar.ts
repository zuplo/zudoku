import { type Navigation } from "zudoku";

/**
 * NOTE: This file should not import anything except zudoku. We use this file
 * in the build of the zuplo docs site to generate the sidebar there.
 */

export const docs: Navigation = [
  {
    type: "category",
    label: "Getting started",
    icon: "circle-play",
    items: ["introduction", "app-quickstart"],
  },
  {
    type: "category",
    label: "Configuration",
    icon: "cog",
    link: "configuration/overview",
    items: [
      "configuration/api-reference",
      "configuration/api-catalog",
      "configuration/navigation",
      "configuration/search",
      "configuration/page",
      "configuration/footer",
      "configuration/slots",
      "configuration/authentication",
      "configuration/build-configuration",
      "configuration/sentry",
      "configuration/vite-config",
    ],
  },
  {
    type: "category",
    label: "Customization",
    icon: "palette",
    items: ["customization/colors-theme", "customization/fonts"],
  },
  {
    type: "category",
    label: "Markdown",
    icon: "book-open-text",
    link: "markdown/overview",
    items: ["markdown/mdx", "markdown/admonitions", "markdown/code-blocks"],
  },
  {
    type: "category",
    label: "Guides",
    icon: "monitor-check",
    items: [
      "guides/static-files",
      "guides/environment-variables",
      "guides/custom-pages",
      "guides/navigation-migration",
      "guides/using-multiple-apis",
      "guides/managing-api-keys-and-identities",
      "guides/transforming-examples",
      "guides/processors",
    ],
  },
  {
    type: "category",
    label: "Deployment",
    icon: "cloud-upload",
    link: "deployment",
    items: [
      "deploy/cloudflare-pages",
      "deploy/github-pages",
      "deploy/vercel",
      "deploy/direct-upload",
    ],
  },
  {
    type: "category",
    label: "Extending",
    icon: "blocks",
    items: ["custom-plugins", "extending/events"],
  },
];
export const components: Navigation = [
  {
    icon: "component",
    type: "category",
    label: "Components",
    items: [
      "components/callout",
      "components/icons",
      "components/slot",
      "components/stepper",
      "components/syntax-highlight",
      "components/playground",
      "components/shadcn",
    ],
  },
];
