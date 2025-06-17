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
  children?: ReactNode;
  code?: ReactNode;
  showCopy?: "hover" | "always" | "never";
  showCopyText?: boolean;
  disabled?: boolean;
  showLineNumbers?: boolean;
};

export const EmbeddedCodeBlock = ({
  children,
  language,
  showCopy = "hover",
  showCopyText,
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
        "code-block-wrapper relative group bg-muted/50",
        showLineNumbers && "line-numbers",
      )}
    >
      <div
        className={cn(
          "code-block text-sm not-prose scrollbar overflow-x-auto scrollbar p-4",
          props.className,
        )}
        ref={ref}
      >
        {children}
      </div>
      {showLanguageIndicator && (
        <span
          className={cn(
            "absolute top-1.5 end-3 !text-[11px] font-mono text-muted-foreground transition group-hover:opacity-0",
            showCopy === "always" && "hidden",
          )}
        >
          {language}
        </span>
      )}
      {showCopy !== "never" && (
        <button
          type="button"
          aria-label="Copy code"
          title="Copy code"
          className={cn(
            "absolute top-2 end-2 p-2 transition hover:shadow-xs active:shadow-none active:inset-shadow-xs hover:outline outline-border rounded-md text-sm text-muted-foreground",
            showCopy === "hover" && "opacity-0 group-hover:opacity-100",
            showCopyText && "flex gap-2 items-center font-medium",
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
};
