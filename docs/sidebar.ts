import { type SidebarEntry } from "zudoku";

/**
 * NOTE: This file should not import anything except zudoku. We use this file
 * in the build of the zuplo docs site to generate the sidebar there.
 */

export const docs: SidebarEntry = [
  {
    type: "category",
    label: "Getting started",
    icon: "sparkles",
    items: ["introduction", "app-quickstart", "html-quickstart"],
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
      "configuration/authentication",
      "configuration/customization",
      "configuration/sentry",
      "configuration/vite-config",
    ],
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
    label: "Guide",
    icon: "monitor-check",
    items: [
      "static-files",
      "environment-variables",
      "custom-pages",
      "using-multiple-apis",
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
    items: ["custom-plugins", "api-keys"],
  },
];
export const components: SidebarEntry = [
  {
    icon: "component",
    type: "category",
    label: "Components",
    items: ["components/callout", "components/icons", "components/shadcn"],
  },
];
