import type { ReactNode } from "react";
import { cn } from "../util/cn.js";

export const InlineCode = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <code
    className={cn(
      "font-mono border p-1 py-0.5 rounded bg-border/50 dark:bg-border/70 whitespace-nowrap",
      className,
    )}
  >
    {children}
  </code>
);
