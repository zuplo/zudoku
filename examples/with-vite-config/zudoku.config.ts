import type { ZudokuConfig } from "zudoku";
import navigation from "./navigation.js";

const config: ZudokuConfig = {
  navigation,
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
