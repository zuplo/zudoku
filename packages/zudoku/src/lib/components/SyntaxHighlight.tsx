import {
  Highlight,
  Prism,
  themes,
  type HighlightProps,
} from "prism-react-renderer";

import { CheckIcon, CopyIcon } from "lucide-react";

globalThis.Prism = Prism;
// @ts-expect-error This is untyped
void import("prismjs/components/prism-bash.min.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-ruby.min.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-markup-templating.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-markup.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-php.min.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-json.min.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-java.min.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-csharp.min.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-objectivec.min.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-markdown.min.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-javascript.min.js");
// @ts-expect-error This is untyped
void import("prismjs/components/prism-typescript.min.js");

import { useState } from "react";
import { cn } from "../util/cn.js";
import { useTheme } from "./context/ThemeContext.js";

type SyntaxHighlightProps = {
  className?: string;
  noBackground?: boolean;
  wrapLines?: boolean;
  copyable?: boolean;
  showLanguageIndicator?: boolean;
  language?: string;
} & Omit<HighlightProps, "children" | "language">;

export const SyntaxHighlight = ({
  copyable = true,
  language = "plain",
  ...props
}: SyntaxHighlightProps) => {
  const [isDark] = useTheme();
  const [isCopied, setIsCopied] = useState(false);

  if (!props.code) {
    return null;
  }

  return (
    <Highlight
      theme={isDark ? themes.vsDark : themes.github}
      language={language}
      {...props}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <div className="relative group">
          <pre
            className={cn(
              "relative scrollbar overflow-x-auto",
              className,
              props.className,
              props.noBackground && "!bg-transparent",
              props.wrapLines && "whitespace-pre-wrap break-words",
            )}
            style={style}
          >
            {tokens.map((line, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
          {props.showLanguageIndicator && (
            <span className="absolute top-1.5 right-3 text-[11px] font-mono text-muted-foreground transition group-hover:opacity-0">
              {language}
            </span>
          )}
          {copyable && (
            <button
              type="button"
              aria-label="Copy code"
              title="Copy code"
              className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 group-hover:bg-zinc-100 group-hover:dark:bg-zinc-700 hover:outline hover:outline-border/75 dark:hover:outline-border rounded-md text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition"
              disabled={isCopied}
              onClick={() => {
                setIsCopied(true);
                void navigator.clipboard.writeText(
                  tokens
                    .map((line) => line.map(({ content }) => content).join(""))
                    .join("\n"),
                );
                setTimeout(() => setIsCopied(false), 2000);
              }}
            >
              {isCopied ? (
                <CheckIcon className="text-emerald-600" size={16} />
              ) : (
                <CopyIcon size={16} />
              )}
            </button>
          )}
        </div>
      )}
    </Highlight>
  );
};
