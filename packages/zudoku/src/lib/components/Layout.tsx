import { Helmet } from "@zudoku/react-helmet-async";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "../util/cn.js";
import { useScrollToAnchor } from "../util/useScrollToAnchor.js";
import { useScrollToTop } from "../util/useScrollToTop.js";
import { useViewportAnchor } from "./context/ViewportAnchorContext.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { Header } from "./Header.js";
import { Sidebar } from "./navigation/Sidebar.js";
import { Slotlet } from "./SlotletProvider.js";
import { Spinner } from "./Spinner.js";

export const Layout = ({ children }: { children?: ReactNode }) => {
  const location = useLocation();
  const { setActiveAnchor } = useViewportAnchor();
  const { meta, authentication } = useZudoku();

  useScrollToAnchor();
  useScrollToTop();

  const previousLocationPath = useRef(location.pathname);

  useEffect(() => {
    // Initialize the authentication plugin
    authentication?.pageLoad ? authentication.pageLoad() : null;
  }, [authentication]);

  useEffect(() => {
    // always reset on location change
    if (location.pathname !== previousLocationPath.current) {
      setActiveAnchor("");
    }
    previousLocationPath.current = location.pathname;
  }, [location.pathname, setActiveAnchor]);

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
      <Header />

      <div className="w-full max-w-screen-2xl mx-auto px-10 lg:px-12">
        <Suspense
          fallback={
            <main className="grid h-full place-items-center">
              <Spinner />
            </main>
          }
        >
          <Sidebar />
          <main
            className={cn(
              "dark:border-white/10 translate-x-0",
              "lg:overflow-visible",
              // This works in tandem with the `SidebarWrapper` component
              "lg:peer-data-[navigation=true]:w-[calc(100%-var(--side-nav-width))]",
              "lg:peer-data-[navigation=true]:translate-x-[--side-nav-width] lg:peer-data-[navigation=true]:pl-12",
            )}
          >
            <Slotlet name="zudoku-before-content" />
            {children ?? <Outlet />}
            <Slotlet name="zudoku-after-content" />
          </main>
        </Suspense>
      </div>
    </>
  );
};
