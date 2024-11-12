import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { DevPortalContext } from "../../core/DevPortalContext.js";
import { joinPath } from "../../util/joinPath.js";
import { traverseSidebar } from "../navigation/utils.js";

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

export const useCurrentNavigation = () => {
  const { getPluginSidebar, sidebars, topNavigation } = useZudoku();
  const location = useLocation();

  const currentSidebarItem = Object.entries(sidebars).find(([, sidebar]) => {
    return traverseSidebar(sidebar, (item) => {
      const itemId =
        item.type === "doc"
          ? joinPath(item.id)
          : item.type === "category" && item.link
            ? joinPath(item.link.id)
            : undefined;

      if (itemId === location.pathname) {
        return item;
      }
    });
  });
  const currentTopNavItem =
    topNavigation.find((t) => t.id === currentSidebarItem?.[0]) ??
    topNavigation.find((item) => matchPath(item.id, location.pathname));

  return useSuspenseQuery({
    queryFn: async () => {
      const pluginSidebar = await getPluginSidebar(location.pathname);

      return {
        sidebar: [
          ...(currentSidebarItem ? currentSidebarItem[1] : []),
          ...pluginSidebar,
        ],
        topNavItem: currentTopNavItem,
      };
    },
    queryKey: ["navigation", location.pathname],
  });
};
