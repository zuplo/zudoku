import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
  transformerRenderWhitespace,
} from "@shikijs/transformers";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { createHighlighter } from "shiki";

import { cn } from "../util/cn.js";
import { ClientOnly } from "./ClientOnly.js";

type SyntaxHighlightProps = {
  className?: string;
  noBackground?: boolean;
  wrapLines?: boolean;
  copyable?: boolean;
  showLanguageIndicator?: boolean;
  language?: string;
  code?: string;
};

const highlighter = await createHighlighter({
  themes: ["github-dark", "github-light"],
  langs: [
    "javascript",
    "typescript",
    "json",
    "bash",
    "shell",
    "yaml",
    "html",
    "json",
    "jsonc",
    "ruby",
    "objective-c",
    "java",
    "tsx",
    "jsx",
  ],
});

export const SyntaxHighlight = ({
  copyable = true,
  language = "plain",
  ...props
}: SyntaxHighlightProps) => {
  const { resolvedTheme } = useTheme();
  const [isCopied, setIsCopied] = useState(false);

  if (!props.code) {
    return null;
  }

  const html = highlighter.codeToHtml(props.code, {
    lang: language,
    theme: resolvedTheme === "dark" ? "github-dark" : "github-light",
    transformers: [
      transformerMetaHighlight(),
      transformerNotationDiff(),
      transformerNotationErrorLevel(),
      transformerNotationFocus(),
      transformerNotationHighlight(),
      transformerNotationWordHighlight(),
      transformerRenderWhitespace(),
    ],
  });

  // hardcoded values from the themes to avoid color flash in SSR
  const themeColorClasses =
    "bg-[#f6f8fa] text-[#393a34] dark:bg-[#1e1e1e] dark:text-[#9cdcfe]";

  return (
    <ClientOnly
      fallback={
        <div className="relative group">
          <pre
            className={cn(
              "relative scrollbar overflow-x-auto",
              props.className,
              props.noBackground ? "!bg-transparent" : themeColorClasses,
              props.wrapLines && "whitespace-pre-wrap break-words",
            )}
          >
            {props.code}
          </pre>
          {props.showLanguageIndicator && (
            <span className="absolute top-1.5 right-3 text-[11px] font-mono text-muted-foreground transition group-hover:opacity-0">
              {language}
            </span>
          )}
        </div>
      }
    >
      <div className="relative group">
        <pre
          className={cn(
            "relative scrollbar overflow-x-auto",
            props.className,
            props.noBackground && "!bg-transparent",
            props.wrapLines && "whitespace-pre-wrap break-words",
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        ></pre>
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
              void navigator.clipboard.writeText(props.code ?? "");
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
          </button>
        )}
      </div>
    </ClientOnly>
  );
};
