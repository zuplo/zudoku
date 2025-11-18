import { CheckIcon, CopyIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { cn } from "../util/cn.js";
import { Button } from "./Button.js";

export type CodeBlockProps = {
  className?: string;
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
  fullHeight,
  language,
  showCopy = "hover",
  showCopyText,
  showLanguageIndicator = true,
  showLineNumbers,
  ...props
}: CodeBlockProps & { fullHeight?: boolean }) => {
  const [isCopied, setIsCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (!children) return null;

  return (
    <div
      className={cn(
        "code-block-wrapper relative group bg-muted/50",
        showLineNumbers && "line-numbers",
        fullHeight && "h-full",
      )}
    >
      <div className="relative overflow-auto">
        <div
          className={cn(
            "code-block text-sm not-prose scrollbar [&>pre]:overflow-x-auto [&_code]:p-2",
            fullHeight && "h-full [&>pre]:h-full",
            props.className,
          )}
          ref={ref}
        >
          {children}
        </div>
      </div>
      {showLanguageIndicator && (
        <span
          className={cn(
            "absolute top-1.5 end-3 text-[11px]! font-mono text-muted-foreground transition group-hover:opacity-0 pointer-events-none",
            showCopy === "always" && "hidden",
          )}
        >
          {language}
        </span>
      )}
      {showCopy !== "never" && (
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className={cn(
            "absolute top-2 end-2 p-2",
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
              className="shrink-0 text-emerald-600 dark:text-emerald-300"
              size={13}
              strokeWidth={2.5}
              absoluteStrokeWidth
            />
          ) : (
            <CopyIcon className="shrink-0" size={13} />
          )}
          {showCopyText && "Copy"}
        </Button>
      )}
    </div>
  );
};
