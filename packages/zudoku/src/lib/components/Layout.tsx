import { Helmet } from "@zudoku/react-helmet-async";
import { PanelLeftIcon } from "lucide-react";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Drawer, DrawerTrigger } from "../ui/Drawer.js";
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
    authentication?.pageLoad?.();
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
      <Slotlet name="layout-before-head" />
      <Header />
      <Slotlet name="layout-after-head" />

      <div className="w-full max-w-screen-2xl mx-auto px-10 lg:px-12">
        <Suspense
          fallback={
            <main className="grid h-[calc(100vh-var(--header-height))] place-items-center">
              <Spinner />
            </main>
          }
        >
          <Drawer direction="left">
            <Sidebar />
            <div
              className={cn(
                "lg:hidden -mx-10 px-10 py-2 sticky bg-background/80 backdrop-blur z-10 top-0 left-0 right-0 border-b",
                "peer-data-[navigation=false]:hidden",
              )}
            >
              <DrawerTrigger className="flex items-center gap-2">
                <PanelLeftIcon size={16} strokeWidth={1.5} />
                <span className="text-sm">Menu</span>
              </DrawerTrigger>
            </div>
            <main
              className={cn(
                "h-full dark:border-white/10 translate-x-0",
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
          </Drawer>
        </Suspense>
      </div>
    </>
  );
};
