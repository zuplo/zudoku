import { cx } from "class-variance-authority";
import { deepEqual } from "fast-equals";
import { Suspense } from "react";
import { NavLink } from "react-router";
import { type NavigationItem } from "../../config/validators/NavigationSchema.js";
import { useAuth } from "../authentication/hook.js";
import { joinUrl } from "../util/joinUrl.js";
import { useCurrentNavigation, useZudoku } from "./context/ZudokuContext.js";
import { isHiddenItem, traverseNavigationItem } from "./navigation/utils.js";
import { Slot } from "./Slot.js";

export const TopNavigation = () => {
  const { navigation } = useZudoku();
  const { isAuthenticated } = useAuth();

  const filteredItems = navigation.filter(isHiddenItem(isAuthenticated));

  if (filteredItems.length === 0 || import.meta.env.MODE === "standalone") {
    return <style>{`:root { --top-nav-height: 0px; }`}</style>;
  }

  return (
    <Suspense>
      <div className="items-center justify-between px-8 h-(--top-nav-height) hidden lg:flex text-sm relative">
        <nav className="text-sm">
          <ul className="flex flex-row items-center gap-8">
            {filteredItems.map((item) => (
              <li key={item.label + item.type}>
                <TopNavItem {...item} />
              </li>
            ))}
          </ul>
        </nav>
        <Slot.Target name="top-navigation-side" />
      </div>
      {/* <PageProgress /> */}
    </Suspense>
  );
};

const getPathForItem = (item: NavigationItem): string => {
  switch (item.type) {
    case "doc":
      return joinUrl(item.path);
    case "link":
      return item.to;
    case "category": {
      if (item.link?.path) {
        return joinUrl(item.link.path);
      }

      return (
        traverseNavigationItem(item, (child) => {
          if (child.type !== "category") {
            return getPathForItem(child);
          }
        }) ?? ""
      );
    }
    case "custom-page":
      return item.path;
  }
};

export const TopNavItem = (item: NavigationItem) => {
  const currentNav = useCurrentNavigation();
  const isActiveTopNavItem = deepEqual(currentNav.topNavItem, item);

  const path = getPathForItem(item);

  return (
    // We don't use isActive here because it has to be inside the navigation,
    // the top nav id doesn't necessarily start with the navigation id
    <NavLink
      viewTransition
      to={path}
      className={({ isActive, isPending }) =>
        cx(
          "flex items-center gap-2 lg:py-3.5 font-medium -mb-px transition duration-150 delay-75 relative",
          isActive || isActiveTopNavItem || isPending
            ? [
                "text-foreground",
                // underline with view transition animation
                "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0",
                "after:h-0.5 after:bg-primary after:[view-transition-name:top-nav-underline]",
                isPending && "after:bg-primary/25",
              ]
            : "text-foreground/75 hover:text-foreground",
        )
      }
    >
      {item.icon && <item.icon size={16} className="align-[-0.125em]" />}
      {item.label}
    </NavLink>
  );
};
