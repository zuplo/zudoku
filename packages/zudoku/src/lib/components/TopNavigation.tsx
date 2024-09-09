import { cx } from "class-variance-authority";
import { NavLink } from "react-router-dom";

import { TopNavigationItem } from "../../config/validators/validate.js";
import { joinPath } from "../util/joinPath.js";
import { useCurrentNavigation, useZudoku } from "./context/ZudokuContext.js";
import { traverseSidebar } from "./navigation/utils.js";

export const TopNavigation = () => {
  const { topNavigation } = useZudoku();

  // Hide top nav if there is only one item
  if (topNavigation.length <= 1) {
    return <style>{`:root { --top-nav-height: 0px; }`}</style>;
  }

  return (
    <nav className="hidden lg:block border-b text-sm px-12 h-[--top-nav-height]">
      <ul className="flex flex-row items-center gap-8">
        {topNavigation.map((item) => (
          <li key={item.id}>
            <TopNavItem {...item} />
          </li>
        ))}
      </ul>
    </nav>
  );
};

const TopNavItem = ({ id, label, default: defaultLink }: TopNavigationItem) => {
  const { sidebars } = useZudoku();
  const nav = useCurrentNavigation();
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
    throw new Error(
      `No links found in top navigation for top navigation '${id}'. Check that the sidebar isn't empty or that a default link set.`,
    );
  }

  // Manually set the active sidebar based on our logic of what is active
  const isActive = nav.data.topNavItem?.id === id;

  return (
    <NavLink
      className={cx(
        "block py-3.5 font-medium -mb-px border-b-2",
        isActive
          ? "border-primary text-foreground"
          : "border-transparent text-foreground/75 hover:text-foreground hover:border-accent-foreground/25",
      )}
      to={first}
    >
      {label}
    </NavLink>
  );
};
