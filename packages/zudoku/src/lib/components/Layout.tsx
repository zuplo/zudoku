import { Helmet } from "@zudoku/react-helmet-async";
import { Suspense, useEffect, type ReactNode } from "react";
import { Outlet, useNavigation } from "react-router";
import { useSpinDelay } from "spin-delay";
import { useScrollToAnchor } from "../util/useScrollToAnchor.js";
import { useScrollToTop } from "../util/useScrollToTop.js";
import { useZudoku } from "./context/ZudokuContext.js";
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
  const { meta, authentication } = useZudoku();

  useScrollToAnchor();
  useScrollToTop();

  useEffect(() => {
    // Initialize the authentication plugin
    authentication?.onPageLoad?.();
  }, [authentication]);

  // Page transition is happening: https://reactrouter.com/start/framework/pending-navigation
  const isNavigating = Boolean(useNavigation().location);
  const showSpinner = useSpinDelay(isNavigating, {
    delay: 300,
    minDuration: 500,
  });

  return (
    <>
      {import.meta.env.MODE === "standalone" && (
        <style>{`:root { --top-nav-height: 0px; }`}</style>
      )}
      <Helmet titleTemplate={meta?.title}>
        {meta?.description && (
          <meta name="description" content={meta.description} />
        )}
        {meta?.favicon && <link rel="icon" href={meta.favicon} />}
      </Helmet>
      <Slotlet name="layout-before-head" />
      <Header />
      <Slotlet name="layout-after-head" />

      <div className="grid grid-cols-1 grid-rows-[min-content_1fr] lg:grid-cols-[var(--side-nav-width)_1fr] max-w-screen-2xl w-full lg:mx-auto px-4 lg:px-8 2xl:border-x">
        {showSpinner ? (
          <LoadingFallback />
        ) : (
          <Suspense fallback={<LoadingFallback />}>
            <Main>{children ?? <Outlet />}</Main>
          </Suspense>
        )}
      </div>
    </>
  );
};
