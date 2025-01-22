import type { PropsWithChildren } from "react";
import { cn } from "../../util/cn.js";

type BaseComponentProps<T = unknown> = PropsWithChildren<
  T & { className?: string }
>;

export const Root = ({ children, className }: BaseComponentProps) => (
  <div
    className={cn("rounded-xl overflow-hidden border border-border", className)}
  >
    {children}
  </div>
);

export const Head = ({ children, className }: BaseComponentProps) => (
  <div
    className={cn(
      "border-b bg-muted dark:bg-transparent text-card-foreground p-3 py-2.5",
      className,
    )}
  >
    {children}
  </div>
);

export const Body = ({ children, className }: BaseComponentProps) => (
  <div className={cn("bg-card overflow-auto p-2", className)}>{children}</div>
);

export const Footer = ({ children, className }: BaseComponentProps) => (
  <div className={cn("border-t bg-muted dark:bg-transparent p-3", className)}>
    {children}
  </div>
);
