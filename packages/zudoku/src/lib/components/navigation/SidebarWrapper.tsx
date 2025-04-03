import { type PropsWithChildren, type Ref } from "react";
import { cn } from "../../util/cn.js";
import PoweredByZudoku from "./PoweredByZudoku.js";
export const SidebarWrapper = ({
  children,
  className,
  ref,
}: PropsWithChildren<{
  className?: string;
  ref?: Ref<HTMLDivElement>;
}>) => (
  <div className="grid sticky top-[--header-height] h-[calc(100vh-var(--header-height))] grid-rows-[1fr_min-content] border-r">
    <nav
      className={cn(
        "hidden max-w-[calc(var(--side-nav-width)+var(--padding-nav-item))] lg:flex scrollbar flex-col overflow-y-auto shrink-0 text-sm pe-3 ps-4 lg:ps-8",
        "-mx-[--padding-nav-item] pb-6 pt-[--padding-content-top] scroll-pt-2 gap-2",
        className,
      )}
      ref={ref}
    >
      {children}
    </nav>

    <div className="bg-background border-t p-2">
      <PoweredByZudoku />
    </div>
  </div>
);

SidebarWrapper.displayName = "SidebarWrapper";
