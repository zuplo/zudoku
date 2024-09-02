import type { Sidebar } from "zudoku";

export const sidebar: Record<string, Sidebar> = {
  docs: [
    {
      type: "category",
      label: "Getting started",
      items: ["introduction", "getting-started", "installation"],
    },
    {
      type: "category",
      label: "Configuration",
      link: "configuration/overview",
      items: [
        "configuration/navigation",
        "configuration/search",
        "configuration/authentication",
      ],
    },
    {
      type: "category",
      label: "Markdown",
      link: "markdown/overview",
      items: ["markdown/mdx", "markdown/admonitions", "markdown/code-blocks"],
    },
    {
      type: "category",
      label: "Advanced",
      items: ["api-keys", "using-multiple-apis"],
    },
    {
      type: "category",
      label: "Plugins",
      items: ["search", "custom-pages"],
    },
    {
      type: "category",
      label: "Deployment",
      items: [
        "deployment",
        "deploy/cloudflare-pages",
        "deploy/github-pages",
        "deploy/vercel",
        "deploy/direct-upload",
      ],
    },
  ],
};
