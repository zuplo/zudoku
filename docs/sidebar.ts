import type { Sidebar } from "zudoku";

export const sidebar: Record<string, Sidebar> = {
  introduction: [
    {
      type: "doc",
      id: "introduction",
    },
  ],
  docs: [
    {
      type: "category",
      label: "Getting started",
      items: ["getting-started", "installation"],
    },
    {
      type: "category",
      label: "Configuration",
      link: "configuration/index",
      items: [
        "configuration/navigation",
        "configuration/search",
        "configuration/authentication",
      ],
    },
    {
      type: "category",
      label: "Markdown",
      link: "markdown/index",
      items: ["markdown/mdx", "markdown/admonitions", "markdown/code-blocks"],
    },
    {
      type: "category",
      label: "Advanced",
      items: ["authentication", "api-keys", "using-multiple-apis"],
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
