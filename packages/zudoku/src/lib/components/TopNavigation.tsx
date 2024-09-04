import { cx } from "class-variance-authority";
import { NavLink } from "react-router-dom";

import { useZudoku } from "./context/ZudokuContext.js";

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
          <li key={item.label}>
            <NavLink
              className={({ isActive }) =>
                cx(
                  "block py-3.5 font-medium -mb-px border-b-2",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-foreground/75 hover:text-foreground hover:border-accent-foreground/25",
                )
              }
              to={item.id}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
