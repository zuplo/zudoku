import type { ReactNode } from "react";
import { cn } from "../util/cn.js";

export const InlineCode = ({
  className,
  children,
  selectOnClick,
}: {
  className?: string;
  children: ReactNode;
  selectOnClick?: boolean;
}) => (
  <code
    onClick={(e) => {
      if (!selectOnClick) return;
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(e.currentTarget);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }}
    className={cn(
      "font-mono border p-1 py-0.5 rounded bg-border/50 dark:bg-border/70 whitespace-nowrap",
      className,
    )}
  >
    {children}
  </code>
);
