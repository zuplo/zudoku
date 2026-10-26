import { MenuIcon } from "lucide-react";
import { lazy, Suspense, useId, useRef, useState } from "react";
import { PageProgress } from "./PageProgress.js";

const importMobileTopNavigationDrawer = () =>
  import("./MobileTopNavigationDrawer.js").then((module) => ({
    default: module.MobileTopNavigationDrawer,
  }));

let mobileTopNavigationDrawerPromise:
  | ReturnType<typeof importMobileTopNavigationDrawer>
  | undefined;

const loadMobileTopNavigationDrawer = () => {
  mobileTopNavigationDrawerPromise ??= importMobileTopNavigationDrawer();
  return mobileTopNavigationDrawerPromise;
};

const LazyMobileTopNavigationDrawer = lazy(loadMobileTopNavigationDrawer);

export const MobileTopNavigation = () => {
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const preloadDrawer = () => {
    void loadMobileTopNavigationDrawer();
  };

  const openDrawer = () => {
    setDrawerMounted(true);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="flex lg:hidden justify-self-end">
        <button
          ref={triggerRef}
          type="button"
          className="lg:hidden"
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          data-state={drawerOpen ? "open" : "closed"}
          onFocus={preloadDrawer}
          onPointerEnter={preloadDrawer}
          onClick={openDrawer}
        >
          <MenuIcon size={22} aria-hidden="true" />
        </button>
        <PageProgress />
      </div>
      {drawerMounted && (
        <Suspense fallback={null}>
          <LazyMobileTopNavigationDrawer
            id={drawerId}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            triggerRef={triggerRef}
          />
        </Suspense>
      )}
    </>
  );
};
