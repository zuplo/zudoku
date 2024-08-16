import type { ZudokuConfig } from "zudoku";
import navigation from "./navigation.js";

const config: ZudokuConfig = {
  page: {
    pageTitle: "",
    logo: {
      src: {
        light: "/logos/zudoku-light.svg",
        dark: "/logos/zudoku-dark.svg",
      },
      width: "99px",
    },
  },
  metadata: {
    title: "%s | Zudoku",
  },
  navigation,
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
