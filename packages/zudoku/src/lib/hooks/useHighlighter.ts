import { use, useContext } from "react";
import type { HighlighterCore } from "shiki";
import { ZudokuReactContext } from "../components/context/ZudokuReactContext.js";

export const useHighlighter = (): HighlighterCore => {
  const context = useContext(ZudokuReactContext);

  if (!context) {
    throw new Error("useZudoku must be used within a ZudokuProvider.");
  }

  // Ensure context is fully initialized before accessing options
  if (context.initialize) {
    use(context.initialize);
  }

  const { syntaxHighlighting } = context.options;

  if (!syntaxHighlighting) {
    throw new Error(
      "Syntax highlighting not configured. Provide highlighterPromise in syntaxHighlighting options.",
    );
  }

  return use(syntaxHighlighting.highlighterPromise);
};
