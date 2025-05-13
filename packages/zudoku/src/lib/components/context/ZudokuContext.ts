import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { matchPath, useLocation } from "react-router";
import { type SidebarItem } from "../../../config/validators/SidebarSchema.js";
import { useAuth } from "../../authentication/hook.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import { joinUrl } from "../../util/joinUrl.js";
import { CACHE_KEYS } from "../cache.js";
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

const getItemId = (item: SidebarItem) => {
  switch (item.type) {
    case "doc":
      return joinUrl(item.id);
    case "category":
      return item.link ? joinUrl(item.link.id) : undefined;
    case "link":
      return item.href;
    default:
      return undefined;
  }
};
export const useCurrentNavigation = () => {
  const { getPluginSidebar, navigation, options } = useZudoku();
  const location = useLocation();
  const auth = useAuth();

  const isProtectedRoute = options.protectedRoutes?.some((route) =>
    matchPath(route, location.pathname),
  );

  const sidebarItem = traverseSidebar(navigation, (item, parentCategories) => {
    if (getItemId(item) === location.pathname) {
      return parentCategories.at(0) ?? item;
    }
  });

  const { data } = useSuspenseQuery({
    queryFn: () => getPluginSidebar(location.pathname),
    queryKey: ["plugin-sidebar", location.pathname],
  });

  const hideSidebar =
    auth.isAuthEnabled && !auth.isAuthenticated && isProtectedRoute;

  return {
    sidebar: hideSidebar
      ? []
      : [
          ...(sidebarItem?.type === "category" ? sidebarItem.items : []),
          ...data,
        ],
    topNavItem: sidebarItem,
  };
};
