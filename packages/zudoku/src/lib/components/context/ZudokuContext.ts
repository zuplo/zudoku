import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useRef } from "react";
import { matchPath, useLocation } from "react-router";
import type { NavigationItem } from "../../../config/validators/NavigationSchema.js";
import { useAuthState } from "../../authentication/state.js";
import { applyRules } from "../../navigation/applyRules.js";
import { CACHE_KEYS, useCache } from "../cache.js";
import { getItemPath, traverseNavigation } from "../navigation/utils.js";
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
  const context = useZudoku();
  const { getPluginNavigation, navigation, navigationRules } = context;
  const location = useLocation();
  const loggedWarnings = useRef(new Set<string>());

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

  const finalNavigation = useMemo(() => {
    const baseNavigation = [
      ...(topNavItem?.type === "category" ? topNavItem.items : []),
      ...data,
    ];

    if (topNavItem?.label && navigationRules.length > 0) {
      const { result, warnings } = applyRules(
        baseNavigation,
        navigationRules,
        topNavItem?.label,
      );

      if (import.meta.env.DEV) {
        for (const warning of warnings) {
          if (!loggedWarnings.current.has(warning)) {
            loggedWarnings.current.add(warning);
            // biome-ignore lint/suspicious/noConsole: Dev-only navigation rule warnings
            console.warn(`[Zudoku] Navigation rule: ${warning}`);
          }
        }
      }

      return result;
    }

    return baseNavigation;
  }, [topNavItem, data, navigationRules]);

  return {
    navigation: finalNavigation,
    topNavItem,
  };
};
