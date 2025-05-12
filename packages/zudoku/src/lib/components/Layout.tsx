import { Helmet } from "@zudoku/react-helmet-async";
import { Suspense, useEffect, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router";
import { cn } from "../util/cn.js";
import { joinUrl } from "../util/joinUrl.js";
import { useScrollToAnchor } from "../util/useScrollToAnchor.js";
import { useScrollToTop } from "../util/useScrollToTop.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { Footer } from "./Footer.js";
import { Header } from "./Header.js";
import { Main } from "./Main.js";
import { Slotlet } from "./SlotletProvider.js";
import { Spinner } from "./Spinner.js";

const LoadingFallback = () => (
  <main className="col-span-full row-span-full grid place-items-center">
    <Spinner />
  </main>
);

export const Layout = ({ children }: { children?: ReactNode }) => {
  const { meta, authentication, options } = useZudoku();
  const location = useLocation();

  useScrollToAnchor();
  useScrollToTop();

  useEffect(() => {
    // Initialize the authentication plugin
    authentication?.onPageLoad?.();
  }, [authentication]);

  return (
    <>
      {import.meta.env.MODE === "standalone" && (
        <style>{`:root { --top-nav-height: 0px; }`}</style>
      )}
      <Helmet titleTemplate={meta?.title}>
        {options.canonicalUrlOrigin && (
          <link
            rel="canonical"
            href={joinUrl(
              options.canonicalUrlOrigin,
              options.basePath,
              location.pathname,
            )}
          />
        )}
        {meta?.description && (
          <meta name="description" content={meta.description} />
        )}
        {meta?.favicon && <link rel="icon" href={meta.favicon} />}
      </Helmet>
      <Slotlet name="layout-before-head" />
      <Header />
      <Slotlet name="layout-after-head" />

      <div
        className={cn(
          "grid max-w-screen-2xl w-full lg:mx-auto",
          "has-[:only-child]:grid-rows-1 grid-rows-[0_min-content_1fr] lg:grid-rows-[min-content_1fr]",
          "grid-cols-1 lg:grid-cols-[var(--side-nav-width)_1fr]",
        )}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Main>{children ?? <Outlet />}</Main>
        </Suspense>
      </div>
      <Footer />
    </>
  );
};
