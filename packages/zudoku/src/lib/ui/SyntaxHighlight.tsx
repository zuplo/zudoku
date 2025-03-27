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
void import("prismjs/components/prism-markup.js");
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
// @ts-expect-error This is untyped
void import("prismjs/components/prism-jsstacktrace.min.js");

import { useTheme } from "next-themes";
import { memo, useState } from "react";
import { ClientOnly } from "../components/ClientOnly.js";
import { cn } from "../util/cn.js";

export type SyntaxHighlightProps = {
  className?: string;
  noBackground?: boolean;
  wrapLines?: boolean;
  showLanguageIndicator?: boolean;
  language?: string;
  title?: string;
  children?: string;
  code?: string;
  showCopy?: "hover" | "always" | "never";
  showCopyText?: boolean;
  disabled?: boolean;
} & Omit<HighlightProps, "children" | "language">;

const remapLang = {
  mdx: "md",
} as Record<string, string>;

const SyntaxHighlightInner = ({
  language = "plain",
  showCopy = "hover",
  showCopyText,
  title,
  children,
  disabled,
  ...props
}: SyntaxHighlightProps) => {
  const { resolvedTheme } = useTheme();
  const [isCopied, setIsCopied] = useState(false);

  const code = children ?? props.code;

  if (!code) {
    return null;
  }

  const highlightTheme =
    resolvedTheme === "dark" ? themes.vsDark : themes.github;

  // hardcoded values from the themes to avoid color flash in SSR
  const themeColorClasses =
    "bg-[#f6f8fa] text-[#393a34] dark:bg-[#1e1e1e] dark:text-[#9cdcfe]";

  const Wrapper = ({
    children,
    className,
    style,
  }: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <div className="relative group">
      {title && (
        <div className="text-xs text-muted-foreground absolute top-2 font-mono border-b w-full pb-2 px-4 ">
          {title}
        </div>
      )}
      <pre
        className={cn(
          "relative scrollbar overflow-x-auto",
          props.className,
          props.noBackground ? "!bg-transparent" : themeColorClasses,
          props.wrapLines && "whitespace-pre-wrap break-words",
          title && "pt-10",
          className,
        )}
        style={style}
      >
        {children}
      </pre>
      {props.showLanguageIndicator && (
        <span className="absolute top-1.5 right-3 text-[11px] font-mono text-muted-foreground transition group-hover:opacity-0">
          {language}
        </span>
      )}
      {showCopy !== "never" && (
        <button
          type="button"
          aria-label="Copy code"
          title="Copy code"
          className={cn(
            "absolute top-2 right-2 p-2  hover:outline hover:outline-border/75 dark:hover:outline-border rounded-md text-sm text-muted-foreground transition",
            showCopy === "hover"
              ? "opacity-0 group-hover:opacity-100 group-hover:bg-zinc-100 group-hover:dark:bg-zinc-700"
              : "bg-zinc-100 dark:bg-zinc-700",
            showCopyText && "flex gap-2 items-center font-medium",
          )}
          disabled={isCopied}
          onClick={() => {
            setIsCopied(true);
            void navigator.clipboard.writeText(code);
            setTimeout(() => setIsCopied(false), 2000);
          }}
        >
          {isCopied ? (
            <CheckIcon
              className="text-emerald-600"
              size={16}
              strokeWidth={2.5}
              absoluteStrokeWidth
            />
          ) : (
            <CopyIcon size={16} />
          )}
          {showCopyText && "Copy"}
        </button>
      )}
    </div>
  );

  if (disabled) {
    return (
      <ClientOnly fallback={<Wrapper>{code}</Wrapper>}>
        <Wrapper>{code}</Wrapper>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly fallback={<Wrapper>{code}</Wrapper>}>
      <Highlight
        theme={highlightTheme}
        language={remapLang[language] ?? language}
        {...props}
        code={code}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <Wrapper className={className} style={style}>
            {tokens.map((line, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </Wrapper>
        )}
      </Highlight>
    </ClientOnly>
  );
};

export const SyntaxHighlight = memo(SyntaxHighlightInner);

SyntaxHighlight.displayName = "SyntaxHighlight";
