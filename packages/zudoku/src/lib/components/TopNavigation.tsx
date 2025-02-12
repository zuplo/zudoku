import { cx } from "class-variance-authority";
import { FileIcon } from "lucide-react";
import { Suspense } from "react";
import { NavLink, NavLinkProps, useNavigation } from "react-router";
import { TopNavigationItem } from "../../config/validators/common.js";
import { useAuth } from "../authentication/hook.js";
import { cn } from "../util/cn.js";
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

export const SideNavigation = () => {
  const { topNavigation } = useZudoku();
  const { isAuthenticated } = useAuth();

  return (
    <ul className="flex flex-col border rounded-lg gap-1 p-0.5">
      {topNavigation.filter(isHiddenItem(isAuthenticated)).map((item) => (
        <SideNavItem {...item} key={item.id}>
          <li key={item.id} className="flex flex-row px-1 items-center group">
            <div
              className={cn(
                "p-2 border rounded-lg mr-2 ml-0.5 overflow-hidden",
                "group-hover:bg-primary/20 group-hover:accent-primary-foreground group-hover:text-accent-foreground group-hover:border-transparent",
              )}
            >
              <FileIcon size={16} className="text-primary " />
            </div>
            {item.label}
          </li>
        </SideNavItem>
      ))}
    </ul>
  );
};

const SideNavItem = ({
  id,
  default: defaultLink,
  className,
  children,
}: TopNavigationItem & {
  className?: NavLinkProps["className"];
  children: React.ReactNode;
}) => {
  const { first, isActive } = useNavLink({
    id,
    default: defaultLink,
  });

  return (
    <NavLink
      className={({ isPending }) =>
        cx(
          "hover:bg-accent/60 rounded-lg flex flex-row p-1 items-center group",
          isActive || isPending
            ? "border-primary text-foreground"
            : "text-muted-foreground hover:text-foreground",
          className,
        )
      }
      to={first}
    >
      {children}
    </NavLink>
  );
};

const useNavLink = ({
  id,
  default: defaultLink,
}: Pick<TopNavigationItem, "id" | "default">) => {
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

  return { first, isActive };
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
  className,
}: TopNavigationItem & { className?: NavLinkProps["className"] }) => {
  const { first, isActive } = useNavLink({ id, default: defaultLink });

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
          className,
        )
      }
      to={first}
    >
      {label}
    </NavLink>
  );
};
