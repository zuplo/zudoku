import { CheckIcon, CopyIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { cn } from "../util/cn.js";

export type CodeBlockProps = {
  className?: string;
  noBackground?: boolean;
  wrapLines?: boolean;
  showLanguageIndicator?: boolean;
  language?: string;
  title?: string;
  children?: ReactNode;
  code?: ReactNode;
  showCopy?: "hover" | "always" | "never";
  disabled?: boolean;
  showLineNumbers?: boolean;
};

export const CodeBlock = ({
  children,
  title = "Code",
  language,
  showCopy = "hover",
  showLanguageIndicator = true,
  showLineNumbers,
  ...props
}: CodeBlockProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (!children) return null;

  return (
    <div
      className={cn(
        "border code-block-wrapper relative group bg-muted/50 rounded-md",
        showLineNumbers && "line-numbers",
      )}
    >
      <div className="border-b flex items-center h-10 font-sans bg-black/2">
        <div className="flex-1 text-sm w-full px-4">{title}</div>
        {showLanguageIndicator && (
          <div className={cn("text-sm transition px-4 text-muted-foreground")}>
            {language}
          </div>
        )}{" "}
        {showCopy !== "never" && (
          <button
            type="button"
            aria-label="Copy code"
            title="Copy code"
            className={cn(
              "cursor:pointer border-l h-full active:shadow-none active:inset-shadow-xs hover:inset-shadow-xs flex items-center gap-2 px-4 outline-border text-sm hover:bg-black/5 transition-all",
            )}
            disabled={isCopied}
            onClick={() => {
              if (!ref.current?.textContent) return;

              setIsCopied(true);
              void navigator.clipboard.writeText(ref.current.textContent);
              setTimeout(() => setIsCopied(false), 2000);
            }}
          >
            {isCopied ? (
              <CheckIcon
                className="text-emerald-600"
                size={14}
                strokeWidth={2.5}
                absoluteStrokeWidth
              />
            ) : (
              <CopyIcon size={14} />
            )}
            Copy
          </button>
        )}
      </div>
      <div
        className={cn(
          "code-block text-sm not-prose scrollbar overflow-x-auto scrollbar p-4",
          props.className,
        )}
        ref={ref}
      >
        {children}
      </div>
    </div>
  );
};
