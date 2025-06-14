import { useZudoku } from "../../../../components/context/ZudokuContext.js";
import { highlight } from "../../../../shiki.js";
import invariant from "../../../../util/invariant.js";

export const Highlight = ({
  code,
  language,
  children,
}:
  | { code?: string; children?: never; language?: string }
  | { code?: never; children: string; language: string }) => {
  const { syntaxHighlighting } = useZudoku().options;

  invariant(syntaxHighlighting?.highlighter, "Highlighter not found");

  const highlightedCode = highlight(
    syntaxHighlighting.highlighter,
    code ?? children ?? "",
    language,
    syntaxHighlighting.themes,
  );

  return highlightedCode;
};

Highlight.displayName = "Highlight";
