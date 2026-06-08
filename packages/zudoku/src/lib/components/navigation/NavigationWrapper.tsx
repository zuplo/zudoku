import { type PropsWithChildren, useEffect, useRef } from "react";
import { cn } from "../../util/cn.js";
import { scrollIntoViewIfNeeded } from "../../util/scrollIntoViewIfNeeded.js";
import { useZudoku } from "../context/ZudokuContext.js";
import { PoweredByZudoku } from "./PoweredByZudoku.js";
import { useSidebar } from "./sidebarStore.js";

export const NavigationWrapper = ({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) => {
  const { options } = useZudoku();
  const isCollapsed = useSidebar((s) => s.isCollapsed);
  const navRef = useRef<HTMLDivElement>(null);

  // Scroll the active item into view on mount and whenever it changes.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const scrollActiveIntoView = () => {
      // Leaf and its category both get aria-current; the leaf is last in DOM.
      const active = nav.querySelectorAll('[aria-current="page"]');
      scrollIntoViewIfNeeded(active.item(active.length - 1));
    };
    scrollActiveIntoView();

    const observer = new MutationObserver(scrollActiveIntoView);
    observer.observe(nav, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-current"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "grid sticky top-(--header-height) lg:h-[calc(100vh-var(--header-height))] grid-rows-[1fr_min-content] border-r lg:col-start-1 lg:row-start-1",
        "transition-opacity duration-200 motion-reduce:transition-none",
        isCollapsed && "lg:opacity-0 lg:pointer-events-none",
      )}
      data-pagefind-ignore="all"
      inert={isCollapsed}
    >
      <nav
        ref={navRef}
        className={cn(
          "hidden max-w-[calc(var(--side-nav-width)+var(--padding-nav-item))] lg:flex scrollbar flex-col overflow-y-auto shrink-0 text-sm ps-4 pe-4 lg:ps-8",
          "-mx-(--padding-nav-item) pb-[8vh] pt-(--padding-content-top) scroll-pt-2",
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
        {options.site?.showPoweredBy !== false && <PoweredByZudoku />}
      </div>
    </div>
  );
};

NavigationWrapper.displayName = "NavigationWrapper";
