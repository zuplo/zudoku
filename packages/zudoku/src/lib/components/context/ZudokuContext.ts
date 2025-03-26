import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { matchPath, useLocation } from "react-router";
import { useAuth } from "../../authentication/hook.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import { joinUrl } from "../../util/joinUrl.js";
import { CACHE_KEYS, NO_DEHYDRATE } from "../cache.js";
import { traverseSidebar } from "../navigation/utils.js";

export const ZudokuReactContext = createContext<ZudokuContext | undefined>(
  undefined,
);

export const useZudoku = () => {
  const context = useContext(ZudokuReactContext);

  if (!context) {
    throw new Error("useZudoku must be used within a ZudokuProvider.");
  }

  return context;
};

export const useApiIdentities = () => {
  const { getApiIdentities } = useZudoku();

  return useQuery({
    queryFn: getApiIdentities,
    queryKey: CACHE_KEYS.API_IDENTITIES,
  });
};

export const useCurrentNavigation = () => {
  const { getPluginSidebar, sidebars, topNavigation, options } = useZudoku();
  const location = useLocation();
  const auth = useAuth();

  const isProtectedRoute = options.protectedRoutes?.some((route) =>
    matchPath(route, location.pathname),
  );

  let currentSidebarItem = Object.entries(sidebars).find(([, sidebar]) => {
    return traverseSidebar(sidebar, (item) => {
      const itemId =
        item.type === "doc"
          ? joinUrl(item.id)
          : item.type === "category" && item.link
            ? joinUrl(item.link.id)
            : undefined;

      if (itemId === location.pathname) {
        return item;
      }
    });
  });
  const currentTopNavItem =
    topNavigation.find((t) => t.id === currentSidebarItem?.[0]) ??
    topNavigation.find((item) => matchPath(item.id, location.pathname));

  if (
    currentTopNavItem &&
    !currentSidebarItem &&
    currentTopNavItem.id in sidebars
  ) {
    currentSidebarItem = ["", sidebars[currentTopNavItem.id]!];
  }

  const { data } = useSuspenseQuery({
    queryFn: () => getPluginSidebar(location.pathname),
    // We just want to suspend here and don't store in SSR dehydrated state
    queryKey: ["plugin-sidebar", NO_DEHYDRATE, location.pathname],
  });

  const hideSidebar =
    auth.isAuthEnabled && !auth.isAuthenticated && isProtectedRoute;

  return {
    sidebar: hideSidebar
      ? []
      : [...(currentSidebarItem ? currentSidebarItem[1] : []), ...data],
    topNavItem: currentTopNavItem,
  };
};
