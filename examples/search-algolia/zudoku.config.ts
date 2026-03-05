import { algoliaSearchPlugin } from "@zudoku/plugin-search-algolia";
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  plugins: [
    algoliaSearchPlugin({
      appId: "R2IYF7ETH7",
      apiKey: "599cec31baffa4868cae4e79f180729b",
      indices: ["docsearch"],
    }),
  ],
  navigation: [
    {
      type: "category",
      label: "Documentation",
      items: ["documentation/introduction"],
    },
  ],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
