import { type PropsWithChildren, type Ref } from "react";
import { cn } from "../../util/cn.js";
import { useZudoku } from "../context/ZudokuContext.js";
import { PoweredByZudoku } from "./PoweredByZudoku.js";

export const SidebarWrapper = ({
  children,
  className,
  ref,
}: PropsWithChildren<{
  className?: string;
  ref?: Ref<HTMLDivElement>;
}>) => {
  const { options } = useZudoku();

  return (
    <div className="grid sticky top-[--header-height] h-[calc(100vh-var(--header-height))] grid-rows-[1fr_min-content] border-r">
      <nav
        className={cn(
          "hidden max-w-[calc(var(--side-nav-width)+var(--padding-nav-item))] lg:flex scrollbar flex-col overflow-y-auto shrink-0 text-sm pe-3 ps-4 lg:ps-8",
          "-mx-[--padding-nav-item] pb-6 pt-[--padding-content-top] scroll-pt-2 gap-1",
          className,
        )}
        style={{
          maskImage: `linear-gradient(180deg, transparent 1%, rgba(0, 0, 0, 1) 20px, rgba(0, 0, 0, 1) 90%, transparent 99%)`,
        }}
        ref={ref}
      >
        {children}
      </nav>

      <div className="bg-background border-t p-2 mx-5  gap-2 items-center mt-2 drop-shadow-[0_-3px_1px_rgba(0,0,0,0.015)] hidden [&:has(>_:nth-child(1):last-child)]:flex">
        {options.page?.showPoweredBy !== false && <PoweredByZudoku />}
      </div>
    </div>
  );
};

SidebarWrapper.displayName = "SidebarWrapper";
