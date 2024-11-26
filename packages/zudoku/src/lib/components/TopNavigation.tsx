import { cx } from "class-variance-authority";
import { Suspense } from "react";
import { NavLink } from "react-router-dom";
import { TopNavigationItem } from "../../config/validators/validate.js";
import { useAuth } from "../authentication/hook.js";
import { ZudokuError } from "../util/invariant.js";
import { joinPath } from "../util/joinPath.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { traverseSidebar } from "./navigation/utils.js";

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
      <nav className="hidden lg:block border-b text-sm px-12 h-[--top-nav-height]">
        <ul className="flex flex-row items-center gap-8">
          {topNavigation.filter(isHiddenItem(isAuthenticated)).map((item) => (
            <li key={item.id}>
              <TopNavItem {...item} />
            </li>
          ))}
        </ul>
      </nav>
    </Suspense>
  );
};

const TopNavItem = ({ id, label, default: defaultLink }: TopNavigationItem) => {
  const { sidebars } = useZudoku();
  const currentSidebar = sidebars[id];

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
    <NavLink
      className={({ isActive, isPending }) =>
        cx(
          "block py-3.5 font-medium -mb-px border-b-2",
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
