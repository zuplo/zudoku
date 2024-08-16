import type { NavigationItem } from "zudoku";

const navigation: NavigationItem[] = [
  {
    label: "Documentation",
    path: "/documentation",
    categories: [
      {
        label: "Getting Started",
        children: [
          { label: "Introduction", path: "introduction" },
          { label: "Installation", path: "installation" },
          { label: "components.json", path: "components-json" },
        ],
      },
    ],
  },
  {
    label: "API Reference",
    path: "/api",
    categories: [],
  },
  {
    label: "Settings",
    path: "/settings/api-keys",
  },
];

export default navigation;
