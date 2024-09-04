import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { useLocation } from "react-router-dom";
import { DevPortalContext } from "../../core/DevPortalContext.js";

export const ZudokuReactContext = createContext<DevPortalContext | undefined>(
  undefined,
);

export const useZudoku = () => {
  const context = useContext(ZudokuReactContext);

  if (!context) {
    throw new Error("useDevPortal must be used within a DevPortalProvider.");
  }

  return context;
};

export const useApiIdentities = () => {
  const { getApiIdentities } = useZudoku();
  return useQuery({
    queryFn: getApiIdentities,
    queryKey: ["api-identities"],
  });
};

export const useTopNavigationItem = () => {
  const { topNavigation } = useZudoku();
  const location = useLocation();

  const firstPart = location.pathname.split("/").at(1);
  if (!firstPart) return;

  return topNavigation.find((item) => item.id === firstPart);
};

export const useNavigation = () => {
  const { getPluginSidebar, sidebars } = useZudoku();
  const navItem = useTopNavigationItem();
  const path = navItem?.id;
  const currentSidebar = path ? (sidebars[path] ?? []) : [];
  const location = useLocation();

  return useSuspenseQuery({
    queryFn: async () => {
      const pluginSidebar = path
        ? await getPluginSidebar(path)
        : await getPluginSidebar(location.pathname);

      return {
        items: [...currentSidebar, ...pluginSidebar],
        currentTopNavItem: navItem,
      };
    },
    queryKey: ["navigation", path],
  });
};
