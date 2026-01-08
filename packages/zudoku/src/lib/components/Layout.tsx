import { type ReactNode, Suspense, useEffect } from "react";
import { Outlet } from "react-router";
import { TooltipProvider } from "zudoku/ui/Tooltip.js";
import { cn } from "../util/cn.js";
import { useScrollToAnchor } from "../util/useScrollToAnchor.js";
import { useScrollToTop } from "../util/useScrollToTop.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { Footer } from "./Footer.js";
import { Header } from "./Header.js";
import { Main } from "./Main.js";
import { Slot } from "./Slot.js";
import { Spinner } from "./Spinner.js";

const LoadingFallback = () => (
  <main className="col-span-full row-span-full grid place-items-center">
    <Spinner />
  </main>
);

export const Layout = ({ children }: { children?: ReactNode }) => {
  const { authentication, options } = useZudoku();
  const disableHeader = options.page?.disableHeader === true;
  const disableTopNavigation = options.page?.disableTopNavigation === true;
  const disableFooter = options.page?.disableFooter === true;

  useScrollToAnchor();
  useScrollToTop();

  useEffect(() => {
    // Initialize the authentication plugin
    authentication?.onPageLoad?.();
  }, [authentication]);

  return (
    <TooltipProvider>
      {(disableHeader || disableTopNavigation) && (
        <style>
          {`:root { ${disableHeader ? "--top-header-height: 0px; --banner-height: 0px;" : ""} --top-nav-height: 0px; }`}
        </style>
      )}
      <Slot.Target name="layout-before-head" />
      {!disableHeader && <Header />}
      <Slot.Target name="layout-after-head" />

      <div
        className={cn(
          "grid max-w-screen-2xl w-full lg:mx-auto",
          "[&:has(>:only-child)]:grid-rows-1 grid-rows-[0_min-content_1fr] lg:grid-rows-[min-content_1fr]",
          "grid-cols-1 lg:grid-cols-[var(--side-nav-width)_1fr]",
        )}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Main>{children ?? <Outlet />}</Main>
        </Suspense>
      </div>
      {!disableFooter && <Footer />}
    </TooltipProvider>
  );
};
