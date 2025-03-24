import { type PropsWithChildren, type Ref } from "react";
import { cn } from "../../util/cn.js";

export const SidebarWrapper = ({
  children,
  className,
  ref,
}: PropsWithChildren<{
  className?: string;
  ref?: Ref<HTMLDivElement>;
}>) => (
  <nav
    className={cn(
      "hidden lg:flex h-full scrollbar flex-col overflow-y-auto shrink-0 text-sm border-r pr-6",
      "sticky top-[--header-height] h-[calc(100vh-var(--header-height))]",
      "-mx-[--padding-nav-item] max-w-[--side-nav-width] pb-6 pt-[--padding-content-top] scroll-pt-2 gap-2",
      className,
    )}
    ref={ref}
  >
    {children}
  </nav>
);

SidebarWrapper.displayName = "SidebarWrapper";
