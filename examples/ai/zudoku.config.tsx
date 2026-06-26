import type { ZudokuConfig } from "zudoku";
import { zudokuAiPlugin } from "zudoku/plugins/ai";

const config: ZudokuConfig = {
  site: {
    title: "Zudoku AI",
  },
  redirects: [{ from: "/", to: "/introduction" }],
  navigation: [
    {
      type: "category",
      label: "Documentation",
      items: ["introduction", "usage"],
    },
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
  plugins: [
    zudokuAiPlugin({
      // Point this at your own endpoint that returns an AI SDK UI Message
      // Stream response (see pages/usage.mdx for a backend example).
      api: "/api/chat",
      greeting: "Hi! Ask me anything about the Zudoku AI plugin.",
      shortcut: "i",
      suggestions: [
        "What is the Zudoku AI plugin?",
        "How do I implement the backend?",
        "Can I open the chat from my own button?",
      ],
    }),
  ],
};

export default config;
