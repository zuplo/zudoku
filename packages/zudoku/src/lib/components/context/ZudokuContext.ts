import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { useLocation } from "react-router-dom";
import { SidebarItem } from "../../../config/validators/SidebarSchema.js";
import { TopNavigationItem } from "../../../config/validators/validate.js";
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

  const currentSidebarItem = Object.entries(sidebars).find(([id, sidebar]) => {
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
  const currentTopNavItem = topNavigation.find(
    (t) => t.id === currentSidebarItem?.[0],
  );

  return useSuspenseQuery({
    queryFn: async () => {
      const pluginSidebar = await getPluginSidebar(location.pathname);

      const result: {
        sidebar: SidebarItem[];
        topNavItem: TopNavigationItem | undefined;
      } = {
        sidebar: [
          ...(currentSidebarItem ? currentSidebarItem[1] : []),
          ...pluginSidebar,
        ],
        topNavItem: currentTopNavItem,
      };
      return result;
    },
    queryKey: ["navigation", location.pathname],
  });
};
