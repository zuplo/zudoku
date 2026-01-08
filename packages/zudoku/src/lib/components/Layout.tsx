import { type ReactNode, Suspense, useEffect } from "react";
import { Outlet, useMatches } from "react-router";
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

type PageUiOptions = {
  disableHeader?: boolean;
  disableTopNavigation?: boolean;
  disableFooter?: boolean;
};

const LoadingFallback = () => (
  <main className="col-span-full row-span-full grid place-items-center">
    <Spinner />
  </main>
);

export const Layout = ({ children }: { children?: ReactNode }) => {
  const { authentication } = useZudoku();
  const matches = useMatches();
  const pageUiOptions = matches.reduceRight<PageUiOptions | undefined>(
    (acc, match) => {
      if (acc) return acc;
      const handle = match.handle;
      if (!handle || typeof handle !== "object") return undefined;
      if (!("page" in handle)) return undefined;
      return (handle as { page?: PageUiOptions }).page;
    },
    undefined,
  );
  const disableHeader = pageUiOptions?.disableHeader === true;
  const disableTopNavigation =
    disableHeader || pageUiOptions?.disableTopNavigation === true;
  const disableFooter = pageUiOptions?.disableFooter === true;

  useScrollToAnchor();
  useScrollToTop();

  useEffect(() => {
    // Initialize the authentication plugin
    authentication?.onPageLoad?.();
  }, [authentication]);

  return (
    <TooltipProvider>
      <Slot.Target name="layout-before-head" />
      {disableHeader ? (
        <style>
          {`:root { --top-header-height: 0px; --top-nav-height: 0px; --banner-height: 0px; }`}
        </style>
      ) : (
        <Header disableTopNavigation={disableTopNavigation} />
      )}
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
