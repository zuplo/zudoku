import { cx } from "class-variance-authority";
import { deepEqual } from "fast-equals";
import { Suspense } from "react";
import { NavLink, type NavLinkProps } from "react-router";
import { Separator } from "zudoku/ui/Separator.js";
import type { NavigationItem } from "../../config/validators/NavigationSchema.js";
import { useAuth } from "../authentication/hook.js";
import { joinUrl } from "../util/joinUrl.js";
import { useCurrentNavigation, useZudoku } from "./context/ZudokuContext.js";
import { shouldShowItem, traverseNavigationItem } from "./navigation/utils.js";
import { Slot } from "./Slot.js";

export const TopNavigation = () => {
  const context = useZudoku();
  const {
    options: { navigation = [] },
  } = context;
  const auth = useAuth();
  const filteredItems = navigation.filter(shouldShowItem(auth, context));

  if (filteredItems.length === 0 || import.meta.env.MODE === "standalone") {
    return <style>{`:root { --top-nav-height: 0px; }`}</style>;
  }

  return (
    <Suspense>
      <div className="items-center justify-between px-8 h-(--top-nav-height) hidden lg:flex text-sm relative">
        <nav className="text-sm">
          <ul className="flex flex-row items-center gap-8">
            {filteredItems.map((item) =>
              item.type === "separator" ? (
                <li key={item.label} className="-mx-4 h-7">
                  <Separator orientation="vertical" />
                </li>
              ) : item.type !== "section" && item.type !== "filter" ? (
                <li key={item.label + item.type}>
                  <TopNavItem {...item} />
                </li>
              ) : null,
            )}
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
          if (
            child.type !== "category" &&
            child.type !== "separator" &&
            child.type !== "section"
          ) {
            return getPathForItem(child);
          }
        }) ?? ""
      );
    }
    case "custom-page":
      return item.path;
    default:
      return "";
  }
};

export const TopNavLink = ({
  isActive,
  children,
  ...props
}: {
  isActive?: boolean;
  children: React.ReactNode;
} & NavLinkProps) => {
  return (
    <NavLink
      viewTransition
      className={({ isActive: isActiveNavLink, isPending }) => {
        const isActiveReal = isActiveNavLink || isActive;
        return cx(
          "flex items-center gap-2 lg:py-3.5 font-medium -mb-px transition duration-150 delay-75 relative",
          isActiveReal || isPending
            ? [
                "text-foreground",
                // underline with view transition animation
                "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0",
                "after:h-0.5 after:bg-primary",
                isActiveReal &&
                  "after:[view-transition-name:top-nav-underline]",
                isPending && "after:bg-primary/25",
              ]
            : "text-foreground/75 hover:text-foreground",
        );
      }}
      {...props}
    >
      {children}
    </NavLink>
  );
};

export const TopNavItem = (
  item: Exclude<
    NavigationItem,
    { type: "separator" } | { type: "section" } | { type: "filter" }
  >,
) => {
  const currentNav = useCurrentNavigation();
  const isActiveTopNavItem = deepEqual(currentNav.topNavItem, item);

  const path = getPathForItem(item);

  return (
    // We don't use isActive here because it has to be inside the navigation,
    // the top nav id doesn't necessarily start with the navigation id
    <TopNavLink to={path} isActive={isActiveTopNavItem}>
      {item.icon && <item.icon size={16} className="align-[-0.125em]" />}
      {item.label}
    </TopNavLink>
  );
};
