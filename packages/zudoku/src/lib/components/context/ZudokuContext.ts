import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { matchPath, useLocation } from "react-router";
import { type NavigationItem } from "../../../config/validators/NavigationSchema.js";
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
      return item.to;
    case "custom-page":
      return item.path;
    default:
      return undefined;
  }
};
export const useCurrentNavigation = () => {
  const { getPluginNavigation, navigation } = useZudoku();
  const location = useLocation();

  const navItem = traverseNavigation(navigation, (item, parentCategories) => {
    if (getItemPath(item) === location.pathname) {
      return parentCategories.at(0) ?? item;
    }
  });

  const { data } = useSuspenseQuery({
    queryFn: () => getPluginNavigation(location.pathname),
    queryKey: ["plugin-navigation", location.pathname],
  });

  let topNavItem = navItem;
  if (!navItem && data.length > 0) {
    // Extract base paths from plugin navigation items
    const pluginBasePaths = data.flatMap((item) => {
      return getItemPath(item)?.split("?").at(0)?.split("#").at(0) ?? [];
    });

    // Find top-level nav item that matches any plugin base path
    topNavItem = navigation
      .flatMap((item) => {
        const itemPath = getItemPath(item);
        return itemPath ? [{ item, path: itemPath }] : [];
      })
      .sort((a, b) => b.path.length - a.path.length)
      .find(({ path }) => {
        return pluginBasePaths.some(
          (basePath) =>
            matchPath({ path, end: false }, basePath) ??
            matchPath({ path: basePath, end: false }, path),
        );
      })?.item;
  }

  return {
    navigation: [
      ...(navItem?.type === "category" ? navItem.items : []),
      ...data,
    ],
    topNavItem,
  };
};
