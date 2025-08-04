import { CheckIcon, CopyIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "../util/cn.js";
import { useCopyToClipboard } from "../util/useCopyToClipboard.js";

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

const IconToLanguageMap: Record<string, RegExp> = {
  typescript: /(tsx?|typescript)/,
  javascript: /(jsx?|javascript)/,
  markdown: /(md|markdown)/,
  mdx: /mdx/,
  json: /json/,
  yaml: /yaml/,
  toml: /toml/,
  gnubash: /(shell|bash|sh|zsh)/,
  python: /(py|python)/,
  dotnet: /(^cs$|csharp|vb)/,
  rust: /(rs|rust)/,
  ruby: /(rb|ruby)/,
  php: /php/,
  html5: /html?/,
  css: /css/,
};

const getIconUrl = (language?: string) => {
  if (!language) return undefined;

  const icon = Object.entries(IconToLanguageMap).find(([_, regex]) =>
    regex.test(language),
  );
  return icon
    ? `https://cdn.simpleicons.org/${icon[0]}/000/fff?viewbox=auto`
    : undefined;
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

  const iconUrl = showLanguageIndicator ? getIconUrl(language) : undefined;

  return (
    <div
      className={cn(
        "border code-block-wrapper relative group rounded-md overflow-hidden",
        showLineNumbers && "line-numbers",
      )}
    >
      <div className="border-b flex items-center h-10 font-sans bg-black/2">
        <div className="flex items-center gap-2 flex-1 text-sm w-full px-3">
          {iconUrl && (
            <img src={iconUrl} className="h-3 max-w-4" alt={language} />
          )}
          {title}
        </div>{" "}
        {showCopy !== "never" && (
          <button
            type="button"
            aria-label="Copy code"
            title="Copy code"
            className={cn(
              "transition px-2 py-2 mx-1 rounded-sm",
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
        className={cn(
          "code-block text-sm not-prose scrollbar [&_code]:px-3 [&_code]:py-2",
          props.className,
        )}
        ref={ref}
      >
        {children}
      </div>
    </div>
  );
};
