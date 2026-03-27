import { createContext, type ReactNode, useContext } from "react";

export type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
  embedded?: boolean;
  fullHeight?: boolean;
};

export type PlaygroundContextValue = {
  renderCodeBlock?: (props: CodeBlockProps) => ReactNode;
};

const PlaygroundContext = createContext<PlaygroundContextValue>({});

export const PlaygroundProvider = ({
  children,
  ...value
}: PlaygroundContextValue & { children: ReactNode }) => (
  <PlaygroundContext.Provider value={value}>
    {children}
  </PlaygroundContext.Provider>
);

export const usePlaygroundContext = () => useContext(PlaygroundContext);

export const CodeBlock = (props: CodeBlockProps) => {
  const { renderCodeBlock } = usePlaygroundContext();

  if (renderCodeBlock) {
    return renderCodeBlock(props);
  }

  return (
    <pre
      className={props.className}
      style={props.fullHeight ? { height: "100%" } : undefined}
    >
      <code>{props.code}</code>
    </pre>
  );
};
