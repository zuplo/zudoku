import { memo } from "react";
import { useZudoku } from "../components/context/ZudokuContext.js";
import { highlight } from "../shiki.js";
import invariant from "../util/invariant.js";
import { CodeBlock, type CodeBlockProps } from "./CodeBlock.js";
import { EmbeddedCodeBlock } from "./EmbeddedCodeBlock.js";

type SyntaxHighlightProps = CodeBlockProps &
  (
    | {
        code: string;
        embedded?: boolean;
        children?: never;
        fullHeight?: boolean;
      }
    | { code?: never; children: string; embedded?: boolean }
  );

export const SyntaxHighlight = memo(
  ({ code, children, embedded, ...props }: SyntaxHighlightProps) => {
    const { syntaxHighlighting } = useZudoku().options;

    invariant(syntaxHighlighting?.highlighter, "Highlighter not found");

    const highlightedCode = highlight(
      syntaxHighlighting.highlighter,
      code ?? children,
      props.language,
      syntaxHighlighting.themes,
    );

    return embedded ? (
      <EmbeddedCodeBlock {...props}>{highlightedCode}</EmbeddedCodeBlock>
    ) : (
      <CodeBlock {...props}>{highlightedCode}</CodeBlock>
    );
  },
);

SyntaxHighlight.displayName = "SyntaxHighlight";
