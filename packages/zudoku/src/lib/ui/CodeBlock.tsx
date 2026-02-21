import { CheckIcon, CopyIcon } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { LanguageIcon } from "../components/LanguageIcon.js";
import { cn } from "../util/cn.js";
import { useCopyToClipboard } from "../util/useCopyToClipboard.js";

export const CopyCodeButton = ({
  contentRef,
}: {
  contentRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [isCopied, copyToClipboard] = useCopyToClipboard();
  return (
    <button
      type="button"
      aria-label="Copy code"
      title="Copy code"
      className={cn(
        "transition p-1.5 mx-1 rounded-lg",
        !isCopied && "hover:bg-accent hover:brightness-95",
      )}
      disabled={isCopied}
      onClick={() => copyToClipboard(contentRef.current?.textContent ?? "")}
    >
      {isCopied ? (
        <CheckIcon className="text-emerald-600" size={14} />
      ) : (
        <CopyIcon size={14} />
      )}
    </button>
  );
};

export const codeBlockClass = cn(
  "border code-block-wrapper relative group rounded-xl overflow-hidden",
);

export const codeBlockHeaderClass = cn("flex items-center py-0.5 bg-black/4");

export const codeBlockContentClass = cn(
  "code-block p-0.5 text-sm not-prose scrollbar bg-black/4",
  "[&_code]:rounded-b-[calc(var(--radius)+1px)] [&>pre]:rounded-b-[calc(var(--radius)+1px)] [&_code]:px-3 [&_code]:py-2",
);

export type CodeBlockProps = {
  className?: string;
  wrapLines?: boolean;
  showLanguageIndicator?: boolean;
  language?: string;
  icon?: string;
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
  icon,
  showCopy = "hover",
  showLanguageIndicator,
  showLineNumbers,
  ...props
}: CodeBlockProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!children) return null;

  return (
    <div className={cn(codeBlockClass, props.className)}>
      <div className={codeBlockHeaderClass}>
        <div className="flex items-center gap-1.5 flex-1 text-sm w-full px-3">
          {showLanguageIndicator && (
            <LanguageIcon language={icon ?? language} />
          )}
          {title}
        </div>
        {showCopy !== "never" && <CopyCodeButton contentRef={contentRef} />}
      </div>
      <div
        ref={contentRef}
        className={cn(codeBlockContentClass, showLineNumbers && "line-numbers")}
      >
        {children}
      </div>
    </div>
  );
};
