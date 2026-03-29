import { memo, useContext } from "react";
import { ZudokuReactContext } from "../components/context/ZudokuReactContext.js";
import { useHighlighter } from "../hooks/useHighlighter.js";
import { highlight } from "../shiki.js";
import { CodeBlock, type CodeBlockProps } from "./CodeBlock.js";
import { EmbeddedCodeBlock } from "./EmbeddedCodeBlock.js";

export const HighlightedCode = ({
  code,
  language,
  meta,
}: {
  code: string;
  language?: string;
  meta?: string;
}) => {
  const context = useContext(ZudokuReactContext);

  if (!context) {
    throw new Error("useZudoku must be used within a ZudokuProvider.");
  }

  const { syntaxHighlighting } = context.options;
  // useHighlighter handles context initialization and suspends if needed
  const highlighter = useHighlighter();

  return highlight(
    highlighter,
    code,
    language,
    syntaxHighlighting?.themes,
    meta,
  );
};

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
    const Wrapper = embedded ? EmbeddedCodeBlock : CodeBlock;

    return (
      <Wrapper {...props}>
        <HighlightedCode code={code ?? children} language={props.language} />
      </Wrapper>
    );
  },
);

SyntaxHighlight.displayName = "SyntaxHighlight";

export default SyntaxHighlight;
