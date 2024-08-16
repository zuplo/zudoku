import { type ZudokuConfig } from "zudoku";

import navigation from "./apis/navigation.json";

const config: ZudokuConfig = {
  topNavigation: [
    { id: "home", label: "Home" },
    { id: "home2", label: "Home 2" },
  ],
  redirects: [{ from: "/", to: "/home" }],
  sidebar: {
    home: [
      ...navigation.map((item) => ({
        type: "link",
        label: item.label,
        href: `/${item.id}`,
      })),
    ],
  },
  apis: [
    ...navigation.map((item) => ({
      type: "url",
      input: `http://localhost:5942/${item.id}.json`,
      navigationId: item.label,
      skipPreload: true,
    })),
  ],
};

export default config;
