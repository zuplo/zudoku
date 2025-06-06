import { cx } from "class-variance-authority";
import { deepEqual } from "fast-equals";
import { Suspense } from "react";
import { NavLink } from "react-router";
import { type SidebarItem } from "../../config/validators/SidebarSchema.js";
import { useAuth } from "../authentication/hook.js";
import { joinUrl } from "../util/joinUrl.js";
import { useCurrentNavigation, useZudoku } from "./context/ZudokuContext.js";
import { isHiddenItem } from "./navigation/utils.js";
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

const getPathForItem = (item: SidebarItem) => {
  switch (item.type) {
    case "doc":
      return joinUrl(item.file);
    case "link":
      return item.href;
    case "category":
      return joinUrl(item.link?.file ?? "");
    case "custom-page":
      return item.path;
  }
};

export const TopNavItem = (item: SidebarItem) => {
  const currentNav = useCurrentNavigation();
  const isActiveTopNavItem = deepEqual(currentNav.topNavItem, item);

  const path = getPathForItem(item);

  const activeClass = "inset-shadow-[0_-2px_0_0_var(--primary)]";

  return (
    // We don't use isActive here because it has to be inside the sidebar,
    // the top nav id doesn't necessarily start with the sidebar id
    <NavLink
      to={path}
      className={({ isActive, isPending }) =>
        cx(
          "block lg:py-3.5 font-medium -mb-px",
          isActive || isActiveTopNavItem || isPending
            ? [activeClass, "text-foreground", isPending && "animate-pulse"]
            : "text-foreground/75 hover:text-foreground",
        )
      }
    >
      {item.label}
    </NavLink>
  );
};
