import type { UserConfig } from "zudoku/vite";

export default {
  optimizeDeps: {
    include: ["@zuplo/zudoku-plugin-monetization > tinyduration"],
  },
} satisfies UserConfig;
