import type { UserConfig } from "zudoku/vite";

export default {
  optimizeDeps: {
    include: [
      "@zudoku/plugin-search-algolia > @docsearch/core",
      "@zudoku/plugin-search-algolia > @docsearch/modal",
    ],
  },
} satisfies UserConfig;
