import type { PropsWithChildren } from "react";
import { cn } from "../../util/cn.js";

type BaseComponentProps<T = unknown> = PropsWithChildren<
  T & { className?: string }
>;

export const Root = ({ children, className }: BaseComponentProps) => (
  <div
    data-slot="sidecar-box-root"
    className={cn(
      "relative text-xs flex min-w-0 flex-col rounded-xl border bg-muted/50 bg-clip-padding",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-xl)-1px)] before:shadow-[0_1px_2px_1px_--theme(--color-black/4%)] after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-xl)+4px)] after:border after:border-border/50 after:bg-clip-padding **:data-[slot=particle-wrapper]:w-full **:data-[slot=particle-wrapper]:max-w-64 lg:col-span-1 dark:after:bg-background/72",
      className,
    )}
  >
    {children}
  </div>
);

export const Head = ({ children, className }: BaseComponentProps) => (
  <div
    data-slot="sidecar-box-head"
    className={cn(
      "flex items-center gap-3 rounded-b-xl p-2.5 data-[slot=head]:rounded-b-none",
      className,
    )}
  >
    {children}
  </div>
);

export const Body = ({ children, className }: BaseComponentProps) => (
  <div
    data-slot="sidecar-box-body"
    className={cn(
      "overflow-auto -m-px flex min-w-0 flex-1 flex-col overflow-x-auto rounded-t-xl border bg-background",
      "rounded-b last:rounded-b-xl",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-xl)-1px)] dark:before:shadow-[0_-1px_--theme(--color-white/8%)]",
      className,
    )}
  >
    {children}
  </div>
);

export const Footer = ({ children, className }: BaseComponentProps) => (
  <div
    data-slot="sidecar-box-footer"
    className={cn(
      "p-2 rounded-b-xl data-[slot=sidecar-box-footer]:rounded-b-none",
      className,
    )}
  >
    {children}
  </div>
);
