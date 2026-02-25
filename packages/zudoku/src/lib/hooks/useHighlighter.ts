import { use } from "react";
import type { HighlighterCore } from "shiki";
import { useZudoku } from "../components/context/ZudokuContext.js";

export const useHighlighter = (): HighlighterCore => {
  const { syntaxHighlighting } = useZudoku().options;

  if (!syntaxHighlighting) {
    throw new Error(
      "Syntax highlighting not configured. Provide highlighterPromise in syntaxHighlighting options.",
    );
  }

  return use(syntaxHighlighting.highlighterPromise);
};
