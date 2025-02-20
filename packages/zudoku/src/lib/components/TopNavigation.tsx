import { cx } from "class-variance-authority";
import { Suspense } from "react";
import { NavLink, useNavigation } from "react-router";
import { TopNavigationItem } from "../../config/validators/common.js";
import { useAuth } from "../authentication/hook.js";
import { ZudokuError } from "../util/invariant.js";
import { joinPath } from "../util/joinPath.js";
import { useCurrentNavigation, useZudoku } from "./context/ZudokuContext.js";
import { traverseSidebar } from "./navigation/utils.js";
import { Slotlet } from "./SlotletProvider.js";

export const isHiddenItem =
  (isAuthenticated?: boolean) =>
  (item: { display?: "auth" | "anon" | "always" }) => {
    return (
      (item.display === "auth" && isAuthenticated) ||
      (item.display === "anon" && !isAuthenticated) ||
      !item.display ||
      item.display === "always"
    );
  };

export const TopNavigation = () => {
  const { topNavigation } = useZudoku();
  const { isAuthenticated } = useAuth();

  // Hide top nav if there is only one item
  if (topNavigation.length <= 1) {
    return <style>{`:root { --top-nav-height: 0px; }`}</style>;
  }

  return (
    <Suspense>
      <div className=" items-center justify-between px-8 h-[--top-nav-height] hidden lg:flex text-sm">
        <nav className="text-sm">
          <ul className="flex flex-row items-center gap-8">
            {topNavigation.filter(isHiddenItem(isAuthenticated)).map((item) => (
              <li key={item.id}>
                <TopNavItem {...item} />
              </li>
            ))}
          </ul>
        </nav>
        <Slotlet name="top-navigation-side" />
      </div>
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
          if (item.type === "doc") return joinPath(item.id);
        })
      : joinPath(id));

  if (!first) {
    throw new ZudokuError("Page not found.", {
      developerHint: `No links found in top navigation for '${id}'. Check that the sidebar isn't empty or that a default link is set.`,
    });
  }

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
