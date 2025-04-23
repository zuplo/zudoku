import { memo } from "react";
import { highlight } from "../shiki.js";
import { CodeBlock, type CodeBlockProps } from "./CodeBlock.js";

type SyntaxHighlightProps = CodeBlockProps &
  ({ code: string; children?: never } | { code?: never; children: string });

export const SyntaxHighlight = memo(
  ({ code, children, ...props }: SyntaxHighlightProps) => {
    const highlightedCode = highlight(code ?? children, props.language);

    return <CodeBlock {...props}>{highlightedCode}</CodeBlock>;
  },
);

SyntaxHighlight.displayName = "SyntaxHighlight";
