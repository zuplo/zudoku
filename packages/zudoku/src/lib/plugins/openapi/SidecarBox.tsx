import type { PropsWithChildren } from "react";
import { cn } from "../../util/cn.js";

type BaseComponentProps<T = unknown> = PropsWithChildren<
  T & { className?: string }
>;

export const Root = ({ children, className }: BaseComponentProps) => (
  <div
    className={cn(
      "rounded-lg overflow-hidden border dark:border-transparent",
      className,
    )}
  >
    {children}
  </div>
);

export const Head = ({ children, className }: BaseComponentProps) => (
  <div
    className={cn(
      "border-b dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 p-2",
      className,
    )}
  >
    {children}
  </div>
);

export const Body = ({ children, className }: BaseComponentProps) => (
  <div
    className={cn("bg-zinc-50 dark:bg-zinc-800 overflow-auto p-2", className)}
  >
    {children}
  </div>
);

export const Footer = ({ children, className }: BaseComponentProps) => (
  <div
    className={cn(
      "border-t dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 p-2",
      className,
    )}
  >
    {children}
  </div>
);
