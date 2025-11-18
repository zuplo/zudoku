import { CheckIcon, CopyIcon } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { LanguageIcon } from "../components/LanguageIcon.js";
import { cn } from "../util/cn.js";
import { useCopyToClipboard } from "../util/useCopyToClipboard.js";

export type CodeBlockProps = {
  className?: string;
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
  showLanguageIndicator,
  showLineNumbers,
  ...props
}: CodeBlockProps) => {
  const [isCopied, copyToClipboard] = useCopyToClipboard();
  const ref = useRef<HTMLDivElement>(null);

  if (!children) return null;

  return (
    <div
      className={cn(
        "border code-block-wrapper relative group rounded-xl overflow-hidden",
        showLineNumbers && "line-numbers",
        props.className,
      )}
    >
      <div className="border-b flex items-center py-1 font-sans bg-black/2">
        <div className="flex items-center gap-1.5 flex-1 text-sm w-full px-3">
          <LanguageIcon language={language} />
          {title}
        </div>{" "}
        {showCopy !== "never" && (
          <button
            type="button"
            aria-label="Copy code"
            title="Copy code"
            className={cn(
              "transition p-1.5 mx-1 rounded-lg",
              !isCopied && "hover:bg-accent hover:brightness-95",
            )}
            disabled={isCopied}
            onClick={() => {
              if (!ref.current?.textContent) return;

              copyToClipboard(ref.current.textContent);
            }}
          >
            {isCopied ? (
              <CheckIcon className="text-emerald-600" size={14} />
            ) : (
              <CopyIcon size={14} />
            )}
          </button>
        )}
      </div>
      <div
        className="code-block text-sm not-prose scrollbar [&_code]:px-3 [&_code]:py-2"
        ref={ref}
      >
        {children}
      </div>
    </div>
  );
};
