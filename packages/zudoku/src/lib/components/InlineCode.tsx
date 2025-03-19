import type { ReactNode } from "react";
import { SelectOnClick } from "../plugins/openapi/components/SelectOnClick.js";
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
  <SelectOnClick asChild enabled={selectOnClick}>
    <code
      className={cn(
        "font-mono border p-1 py-0.5 rounded bg-border/50 dark:bg-border/70 [overflow-wrap:anywhere]",
        className,
      )}
    >
      {children}
    </code>
  </SelectOnClick>
);
