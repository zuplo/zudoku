import { ChevronRightIcon } from "lucide-react";
import { type PropsWithChildren, type Ref } from "react";
import { cn } from "../../util/cn.js";
import { useZudoku } from "../context/ZudokuContext.js";
import ZudokuLogo from "./ZudokuLogo.js";

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
          // "[mask-image:[linear-gradient(#0000,#000,20px),linear-gradient(270deg,#000 10px,#0000,0)]]",
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
        {options.page?.showPoweredBy !== false && (
          <a
            href="https://zudoku.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex justify-between items-center w-full border border-transparent hover:border-border rounded-full hover:shadow-sm h-7 px-3 text-nowrap hover:bg-muted/80 transition-all"
          >
            <div className="opacity-70 hover:opacity-100 transition-opacity gap-1.5 text-[11px] font-medium rounded-full h-7 flex items-center text-nowrap">
              <ZudokuLogo className="w-3.5 h-3.5 dark:fill-white" />
              powered by Zudoku
            </div>
            <div className="text-xs font-medium opacity-70 hover:text-foreground transition-colors cursor-pointer">
              <ChevronRightIcon
                size={12}
                absoluteStrokeWidth
                strokeWidth={1.5}
              />
            </div>
          </a>
        )}
      </div>
    </div>
  );
};

SidebarWrapper.displayName = "SidebarWrapper";
