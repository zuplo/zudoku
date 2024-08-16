import type { NavigationItem } from "zudoku";

const navigation: NavigationItem[] = [
  {
    label: "Documentation",
    path: "/",
    categories: [
      {
        label: "Getting Started",
        children: [{ label: "Hello", path: "hello" }],
      },
    ],
  },
];

export default navigation;
