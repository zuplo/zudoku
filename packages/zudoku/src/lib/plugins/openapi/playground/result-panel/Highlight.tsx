import { useZudoku } from "../../../../components/context/ZudokuContext.js";
import { useHighlighter } from "../../../../hooks/useHighlighter.js";
import { highlight } from "../../../../shiki.js";

export const Highlight = ({
  code,
  language,
  children,
}:
  | { code?: string; children?: never; language?: string }
  | { code?: never; children: string; language: string }) => {
  const { syntaxHighlighting } = useZudoku().options;
  const highlighter = useHighlighter();

  return highlight(
    highlighter,
    code ?? children ?? "",
    language,
    syntaxHighlighting?.themes,
  );
};

Highlight.displayName = "Highlight";
