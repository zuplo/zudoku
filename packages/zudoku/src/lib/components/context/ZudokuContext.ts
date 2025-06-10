import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { matchPath, useLocation } from "react-router";
import { type NavigationItem } from "../../../config/validators/NavigationSchema.js";
import { useAuth } from "../../authentication/hook.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import { joinUrl } from "../../util/joinUrl.js";
import { CACHE_KEYS } from "../cache.js";
import { traverseNavigation } from "../navigation/utils.js";

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

const getItemPath = (item: NavigationItem) => {
  switch (item.type) {
    case "doc":
      return joinUrl(item.path);
    case "category":
      return item.link ? joinUrl(item.link.path) : undefined;
    case "link":
      return item.href;
    case "custom-page":
      return item.path;
    default:
      return undefined;
  }
};
export const useCurrentNavigation = () => {
  const { getPluginNavigation, navigation, options } = useZudoku();
  const location = useLocation();
  const auth = useAuth();

  const isProtectedRoute = options.protectedRoutes?.some((route) =>
    matchPath(route, location.pathname),
  );

  const navItem = traverseNavigation(navigation, (item, parentCategories) => {
    if (getItemPath(item) === location.pathname) {
      return parentCategories.at(0) ?? item;
    }
  });

  const { data } = useSuspenseQuery({
    queryFn: () => getPluginNavigation(location.pathname),
    queryKey: ["plugin-navigation", location.pathname],
  });

  const hasNavigation =
    auth.isAuthEnabled && !auth.isAuthenticated && isProtectedRoute;

  return {
    navigation: hasNavigation
      ? []
      : [...(navItem?.type === "category" ? navItem.items : []), ...data],
    topNavItem: navItem,
  };
};
