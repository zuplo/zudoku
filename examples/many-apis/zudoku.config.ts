import { type ZudokuConfig } from "zudoku";

import navigation from "./apis/navigation.json";

const config: ZudokuConfig = {
  sidebar: {
    home: [
      "overview",
      ...navigation.map((item) => ({
        type: "link",
        label: item.label,
        href: `/${item.id}`,
      })),
    ],
  },
  redirects: [{ from: "/", to: "/overview" }],
  apis: [
    ...navigation.map((item) => ({
      type: "url",
      input: `http://localhost:5942/${item.id}.json`,
      navigationId: item.label,
      skipPreload: true,
    })),
  ],
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
};

export default config;
