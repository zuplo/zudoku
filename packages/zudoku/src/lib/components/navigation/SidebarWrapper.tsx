import { useEffect, useRef, type PropsWithChildren } from "react";
import { cn } from "../../util/cn.js";
import { scrollIntoViewIfNeeded } from "../../util/scrollIntoViewIfNeeded.js";
import { useZudoku } from "../context/ZudokuContext.js";
import { PoweredByZudoku } from "./PoweredByZudoku.js";

export const SidebarWrapper = ({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) => {
  const { options } = useZudoku();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = navRef.current?.querySelector('[aria-current="page"]');
    scrollIntoViewIfNeeded(active ?? null);
  }, []);

  return (
    <div className="grid sticky top-[--header-height] lg:h-[calc(100vh-var(--header-height))] grid-rows-[1fr_min-content] border-r">
      <nav
        ref={navRef}
        className={cn(
          "hidden max-w-[calc(var(--side-nav-width)+var(--padding-nav-item))] lg:flex scrollbar flex-col overflow-y-auto shrink-0 text-sm pe-3 ps-4 lg:ps-8",
          "-mx-[--padding-nav-item] pb-[8vh] pt-[--padding-content-top] scroll-pt-2 gap-1",
          // Revert the padding/margin on the first child
          "-mt-2.5",
          className,
        )}
        style={{
          maskImage: `linear-gradient(180deg, transparent 1%, rgba(0, 0, 0, 1) 20px, rgba(0, 0, 0, 1) 90%, transparent 99%)`,
        }}
      >
        {children}
      </nav>

      <div className="bg-background border-t p-2 mx-5  gap-2 items-center mt-2 drop-shadow-[0_-3px_1px_rgba(0,0,0,0.015)] hidden lg:[&:has(>_:nth-child(1):last-child)]:flex">
        {options.page?.showPoweredBy !== false && <PoweredByZudoku />}
      </div>
    </div>
  );
};

SidebarWrapper.displayName = "SidebarWrapper";
