import { type PropsWithChildren, type Ref } from "react";
import { cn } from "../../util/cn.js";
import ZudokuLogo from "./ZudokuLogo.js";
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
        "-mx-[--padding-nav-item] pb-6 pt-[--padding-content-top] scroll-pt-2 gap-1",
        // "[mask-image:[linear-gradient(#0000,#000,20px),linear-gradient(270deg,#000 10px,#0000,0)]]",
        className,
      )}
      style={{
        maskImage: `linear-gradient(180deg, transparent 1%, rgba(0, 0, 0, 1) 15px, rgba(0, 0, 0, 1) 90%, transparent 99%)`,
      }}
      ref={ref}
    >
      {children}
    </nav>

    <div className="bg-background border-t p-2 mx-4 flex gap-2 items-center">
      <div className="gap-2 text-xs font-medium border rounded-full shadow-sm h-7 flex items-center px-3 text-nowrap">
        <ZudokuLogo className="w-5 h-5" />
        Powered by Zudoku
      </div>
      {/* <PoweredByZudoku /> */}
    </div>
  </div>
);

SidebarWrapper.displayName = "SidebarWrapper";
