import type { NavigationItem } from "zudoku";

const navigation: NavigationItem[] = [
  {
    label: "Documentation",
    path: "/",
    categories: [
      {
        label: "Getting Started",
        children: [{ label: "Introduction", path: "/intro" }],
      },
      {
        label: "Reference",
        children: [
          { label: "Markdown", path: "/markdown" },
          { label: "API Reference", path: "/api-reference" },
        ],
      },
    ],
  },
];

export default navigation;
