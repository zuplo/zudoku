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
    items: ["introduction", "quickstart"],
  },
  {
    type: "category",
    label: "Configuration",
    icon: "settings",
    link: "configuration/overview",
    items: [
      "customization/colors-theme",
      "customization/fonts",
      "configuration/navigation",
      "configuration/search",
      "configuration/page",
      "configuration/footer",
    ],
  },
  {
    type: "category",
    label: "Writing",
    icon: "book-open-text",
    link: "writing",
    items: [
      "markdown/overview",
      "markdown/frontmatter",
      "markdown/mdx",
      "markdown/admonitions",
      "markdown/code-blocks",
    ],
  },
  {
    type: "category",
    label: "OpenAPI",
    icon: "globe",
    items: ["configuration/api-reference", "configuration/api-catalog"],
  },
  {
    type: "category",
    label: "Authentication",
    icon: "lock",
    items: ["configuration/authentication"],
  },
  {
    type: "category",
    label: "Integrations",
    icon: "blocks",
    items: ["configuration/sentry"],
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
    items: [
      "configuration/build-configuration",
      "configuration/vite-config",
      "configuration/slots",
      "custom-plugins",
      "extending/events",
    ],
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
