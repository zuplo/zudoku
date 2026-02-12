import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import { matchPath, useLocation } from "react-router";
import type { NavigationItem } from "../../../config/validators/NavigationSchema.js";
import { useAuthState } from "../../authentication/state.js";
import { joinUrl } from "../../util/joinUrl.js";
import { CACHE_KEYS, useCache } from "../cache.js";
import { traverseNavigation } from "../navigation/utils.js";
import { ZudokuReactContext } from "./ZudokuReactContext.js";

export const useZudoku = () => {
  const context = useContext(ZudokuReactContext);

  if (!context) {
    throw new Error("useZudoku must be used within a ZudokuProvider.");
  }

  return context;
};

export const useApiIdentities = () => {
  const { getApiIdentities } = useZudoku();
  const { isAuthenticated } = useAuthState();
  const { invalidateCache } = useCache();

  useEffect(() => {
    if (!isAuthenticated) {
      invalidateCache("API_IDENTITIES");
    }
  }, [isAuthenticated, invalidateCache]);

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
      return joinUrl(item.path);
    default:
      return undefined;
  }
};

const extractAllPaths = (items: NavigationItem[]) => {
  const paths = new Set<string>();

  const collectPaths = (items: NavigationItem[]) => {
    for (const item of items) {
      const itemPath = getItemPath(item)?.split("?").at(0)?.split("#").at(0);

      if (itemPath) paths.add(itemPath);
      if (item.type === "category") {
        collectPaths(item.items);
      }
    }
  };
  collectPaths(items);

  return [...paths];
};

export const useCurrentNavigation = () => {
  const {
    getPluginNavigation,
    options: { navigation = [] },
  } = useZudoku();
  const location = useLocation();

  const navItem = traverseNavigation(navigation, (item, parentCategories) => {
    if (item.type === "link") return;
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
    const pluginBasePaths = extractAllPaths(data);

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
