import { PanelLeftIcon } from "lucide-react";
import {
  lazy,
  type PropsWithChildren,
  Suspense,
  useId,
  useRef,
  useState,
} from "react";
import { useNavigation } from "react-router";
import { cn } from "../util/cn.js";
import { useCurrentNavigation, useZudoku } from "./context/ZudokuContext.js";
import { Navigation } from "./navigation/Navigation.js";
import { SidebarToggle } from "./navigation/SidebarToggle.js";
import { Slot } from "./Slot.js";

const importMobileNavigationDrawer = () =>
  import("./navigation/MobileNavigationDrawer.js").then((module) => ({
    default: module.MobileNavigationDrawer,
  }));

let mobileNavigationDrawerPromise:
  | ReturnType<typeof importMobileNavigationDrawer>
  | undefined;

const loadMobileNavigationDrawer = () => {
  mobileNavigationDrawerPromise ??= importMobileNavigationDrawer();
  return mobileNavigationDrawerPromise;
};

const LazyMobileNavigationDrawer = lazy(loadMobileNavigationDrawer);

export const Main = ({ children }: PropsWithChildren) => {
  const [isDrawerMounted, setDrawerMounted] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const { navigation, topNavItem } = useCurrentNavigation();
  const hasNavigation = navigation.length > 0;
  const isNavigating = useNavigation().state === "loading";
  const { options } = useZudoku();

  const preloadDrawer = () => {
    void loadMobileNavigationDrawer();
  };

  const openDrawer = () => {
    setDrawerMounted(true);
    setDrawerOpen(true);
  };

  return (
    <>
      {hasNavigation && (
        <Navigation navigation={navigation} topNavItem={topNavItem} />
      )}
      {hasNavigation && (
        <div className="lg:hidden m-0 p-0 md:-mx-4 md:px-4 py-2 sticky bg-background/80 backdrop-blur-xs z-10 top-0 inset-x-0 border-b flex items-center gap-2">
          <button
            ref={drawerTriggerRef}
            type="button"
            className="flex items-center gap-2 px-4"
            aria-haspopup="dialog"
            aria-expanded={isDrawerOpen}
            aria-controls={drawerId}
            data-state={isDrawerOpen ? "open" : "closed"}
            onFocus={preloadDrawer}
            onPointerEnter={preloadDrawer}
            onClick={openDrawer}
          >
            <PanelLeftIcon size={16} strokeWidth={1.5} />
            <span className="text-sm">Menu</span>
          </button>
          <div className="ms-auto empty:hidden pe-4">
            <Slot.Target name="mobile-top-bar-end" />
          </div>
        </div>
      )}
      {isDrawerMounted && (
        <Suspense fallback={null}>
          <LazyMobileNavigationDrawer
            id={drawerId}
            direction={options.site?.dir === "rtl" ? "right" : "left"}
            navigation={navigation}
            onOpenChange={setDrawerOpen}
            open={isDrawerOpen}
            topNavItem={topNavItem}
            triggerRef={drawerTriggerRef}
          />
        </Suspense>
      )}
      <main
        data-pagefind-body
        className={cn(
          "min-w-0 px-4 lg:pe-8 lg:px-8",
          !hasNavigation && "col-span-full",
          isNavigating && "animate-pulse",
        )}
      >
        <Slot.Target name="content-before" />
        {children}
        <Slot.Target name="content-after" />
      </main>
      {hasNavigation && options.site?.sidebar?.collapsible !== false && (
        <SidebarToggle />
      )}
    </>
  );
};
