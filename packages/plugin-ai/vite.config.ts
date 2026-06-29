import type { UserConfig } from "zudoku/vite";

export default {
  optimizeDeps: {
    include: ["@zudoku/plugin-ai > @ai-sdk/react", "@zudoku/plugin-ai > ai"],
  },
} satisfies UserConfig;
