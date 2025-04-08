import { useNProgress } from "@tanem/react-nprogress";
import { cx } from "class-variance-authority";
import { Suspense, useEffect, useState } from "react";
import { NavLink, useNavigation } from "react-router";
import type { TopNavigationItem } from "../../config/validators/common.js";
import { useAuth } from "../authentication/hook.js";
import { joinUrl } from "../util/joinUrl.js";
import { useCurrentNavigation, useZudoku } from "./context/ZudokuContext.js";
import { traverseSidebar } from "./navigation/utils.js";
import { Slotlet } from "./SlotletProvider.js";

export const isHiddenItem =
  (isAuthenticated?: boolean) =>
  (item: { display?: "auth" | "anon" | "always" | "hide" }): boolean => {
    if (item.display === "hide") return false;
    return (
      (item.display === "auth" && isAuthenticated) ||
      (item.display === "anon" && !isAuthenticated) ||
      !item.display ||
      item.display === "always"
    );
  };

export const PageProgress = () => {
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";
  // delay the animation to avoid flickering
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(isNavigating), 100);

    return () => clearTimeout(timer);
  }, [isNavigating]);

  const { isFinished, progress } = useNProgress({ isAnimating });

  return (
    <div
      className="absolute w-0 left-0 right-0 bottom-[-1px] h-[2px] bg-primary transition-all duration-300 ease-in-out"
      style={{
        opacity: isFinished ? 0 : 1,
        width: isFinished ? 0 : `${progress * 100}%`,
      }}
    />
  );
};

export const TopNavigation = () => {
  const { topNavigation } = useZudoku();
  const { isAuthenticated } = useAuth();

  const filteredItems = topNavigation.filter(isHiddenItem(isAuthenticated));

  if (filteredItems.length === 0) {
    return <style>{`:root { --top-nav-height: 0px; }`}</style>;
  }

  return (
    <Suspense>
      <div className="items-center justify-between px-8 h-[--top-nav-height] hidden lg:flex text-sm relative">
        <nav className="text-sm">
          <ul className="flex flex-row items-center gap-8">
            {filteredItems.map((item) => (
              <li key={item.id}>
                <TopNavItem {...item} />
              </li>
            ))}
          </ul>
        </nav>
        <Slotlet name="top-navigation-side" />
      </div>
      <PageProgress />
    </Suspense>
  );
};

export const TopNavItem = ({
  id,
  label,
  default: defaultLink,
}: TopNavigationItem) => {
  const { sidebars } = useZudoku();
  const currentSidebar = sidebars[id];
  const currentNav = useCurrentNavigation();
  const isNavigating = Boolean(useNavigation().location);
  const isActive = currentNav.topNavItem?.id === id && !isNavigating;

  // TODO: This is a bit of a hack to get the first link in the sidebar
  // We should really process this when we load the config so we can validate
  // that the sidebar is actually set. In this case we just fall back to linking
  // to the id if we can't resolve a sidebar.
  const first =
    defaultLink ??
    (currentSidebar
      ? traverseSidebar(currentSidebar, (item) => {
          if (item.type === "doc") return joinUrl(item.id);
        })
      : joinUrl(id)) ??
    joinUrl(id);

  return (
    // We don't use isActive here because it has to be inside the sidebar,
    // the top nav id doesn't necessarily start with the sidebar id
    <NavLink
      className={({ isPending }) =>
        cx(
          "block lg:py-3.5 font-medium -mb-px",
          isActive || isPending
            ? "border-primary text-foreground"
            : "border-transparent text-foreground/75 hover:text-foreground hover:border-accent-foreground/25",
        )
      }
      to={first}
    >
      {label}
    </NavLink>
  );
};
