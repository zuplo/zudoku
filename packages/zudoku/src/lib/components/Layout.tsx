import { Helmet } from "@zudoku/react-helmet-async";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { Outlet, useLocation, useNavigation } from "react-router";
import { useSpinDelay } from "spin-delay";
import { cn } from "../util/cn.js";
import { useScrollToAnchor } from "../util/useScrollToAnchor.js";
import { useScrollToTop } from "../util/useScrollToTop.js";
import { useViewportAnchor } from "./context/ViewportAnchorContext.js";
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
  const location = useLocation();
  const { setActiveAnchor } = useViewportAnchor();
  const { meta, authentication, page } = useZudoku();

  useScrollToAnchor();
  useScrollToTop();

  const previousLocationPath = useRef(location.pathname);

  useEffect(() => {
    // Initialize the authentication plugin
    authentication?.onPageLoad?.();
  }, [authentication]);

  useEffect(() => {
    // always reset on location change
    if (location.pathname !== previousLocationPath.current) {
      setActiveAnchor("");
    }
    previousLocationPath.current = location.pathname;
  }, [location.pathname, setActiveAnchor]);

  // Page transition is happening: https://reactrouter.com/start/framework/pending-ui#global-pending-navigation
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

      <div
        className={cn(
          "grid lg:grid-cols-[var(--side-nav-width)_1fr] grid-rows-[min-content_1fr] w-full lg:mx-auto px-4 lg:px-8 2xl:border-x",
          page?.layout === "default" && "max-w-screen-2xl",
        )}
      >
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
