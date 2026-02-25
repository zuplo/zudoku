import { memo } from "react";
import { useZudoku } from "../components/context/ZudokuContext.js";
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
  const { syntaxHighlighting } = useZudoku().options;
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
