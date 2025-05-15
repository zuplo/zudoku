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
  showCopyText?: boolean;
  disabled?: boolean;
  showLineNumbers?: boolean;
};

export const CodeBlock = ({
  children,
  title,
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
        "code-block-wrapper relative group bg-muted/50 rounded-md",
        showLineNumbers && "line-numbers",
      )}
    >
      {title && (
        <div className="text-xs text-muted-foreground top-2 font-mono border-b w-full py-2 px-4 ">
          {title}
        </div>
      )}
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
            title && "top-12",
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
            "absolute top-2 end-2 p-2 hover:outline hover:outline-border/75 dark:hover:outline-border rounded-md text-sm text-muted-foreground transition",
            title && "top-10",
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
