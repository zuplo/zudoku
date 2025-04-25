import { memo } from "react";
import { useZudoku } from "../components/context/ZudokuContext.js";
import { highlight } from "../shiki.js";
import { CodeBlock, type CodeBlockProps } from "./CodeBlock.js";

type SyntaxHighlightProps = CodeBlockProps &
  ({ code: string; children?: never } | { code?: never; children: string });

export const SyntaxHighlight = memo(
  ({ code, children, ...props }: SyntaxHighlightProps) => {
    const { syntaxHighlighting } = useZudoku().options;
    const highlightedCode = highlight(
      code ?? children,
      props.language,
      syntaxHighlighting?.themes,
    );

    return <CodeBlock {...props}>{highlightedCode}</CodeBlock>;
  },
);

SyntaxHighlight.displayName = "SyntaxHighlight";
