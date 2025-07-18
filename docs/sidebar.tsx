import { type Navigation } from "zudoku";
import { Introduction } from "./src/Introduction";

/**
 * NOTE: This file should not import anything except zudoku. We use this file
 * in the build of the zuplo docs site to generate the sidebar there.
 */

export const docs: Navigation = [
  {
    type: "category",
    label: "Getting started",
    icon: "circle-play",
    items: [
      {
        type: "custom-page",
        path: "docs/introduction",
        label: "Introduction",
        element: <Introduction />,
      },
      "docs/quickstart",
    ],
  },
  {
    type: "category",
    label: "Configuration",
    icon: "settings",
    link: "configuration/overview",
    items: [
      "docs/customization/colors-theme",
      "docs/customization/fonts",
      "docs/configuration/navigation",
      "docs/configuration/search",
      "docs/configuration/site",
      "docs/configuration/footer",
    ],
  },
  {
    type: "category",
    label: "Writing",
    icon: "book-open-text",
    link: "writing",
    items: [
      "docs/markdown/overview",
      "docs/markdown/frontmatter",
      "docs/markdown/mdx",
      "docs/markdown/admonitions",
      "docs/markdown/code-blocks",
    ],
  },
  {
    type: "category",
    label: "OpenAPI",
    icon: "globe",
    items: [
      "docs/configuration/api-reference",
      "docs/configuration/api-catalog",
    ],
  },
  {
    type: "category",
    label: "Authentication",
    icon: "lock",
    items: ["docs/configuration/authentication"],
  },
  {
    type: "category",
    label: "Integrations",
    icon: "blocks",
    items: ["docs/configuration/sentry"],
  },
  {
    type: "category",
    label: "Guides",
    icon: "monitor-check",
    items: [
      "docs/guides/static-files",
      "docs/guides/environment-variables",
      "docs/guides/custom-pages",
      "docs/guides/navigation-migration",
      "docs/guides/using-multiple-apis",
      "docs/guides/managing-api-keys-and-identities",
      "docs/guides/transforming-examples",
      "docs/guides/processors",
    ],
  },
  {
    type: "category",
    label: "Deployment",
    icon: "cloud-upload",
    link: "deployment",
    items: [
      "docs/deploy/cloudflare-pages",
      "docs/deploy/github-pages",
      "docs/deploy/vercel",
      "docs/deploy/direct-upload",
    ],
  },
  {
    type: "category",
    label: "Extending",
    icon: "blocks",
    items: [
      "docs/configuration/build-configuration",
      "docs/configuration/vite-config",
      "docs/configuration/slots",
      "docs/custom-plugins",
      "docs/extending/events",
    ],
  },
];
export const components: Navigation = [
  {
    icon: "component",
    type: "category",
    label: "Components",
    items: [
      "components/typography",
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
