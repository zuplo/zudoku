import type { AllHTMLAttributes } from "react";
import { cn } from "../util/cn.js";

export const InlineCode = ({
  className,
  ...props
}: AllHTMLAttributes<HTMLSpanElement>) => (
  <code
    className={cn(
      "font-mono border p-1 py-0.5 rounded-sm bg-border/50 dark:bg-border/70 wrap-anywhere",
      className,
    )}
    {...props}
  />
);
