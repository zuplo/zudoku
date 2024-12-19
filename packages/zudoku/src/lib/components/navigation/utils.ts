import { useLocation } from "react-router";
import type {
  SidebarItem,
  SidebarItemCategory,
} from "../../../config/validators/SidebarSchema.js";
import { joinPath } from "../../util/joinPath.js";
import { useCurrentNavigation } from "../context/ZudokuContext.js";

export type TraverseCallback<T> = (
  item: SidebarItem,
  parentCategories: SidebarItem[],
) => T | void;

export const traverseSidebar = <T>(
  sidebar: SidebarItem[],
  callback: TraverseCallback<T>,
): T | undefined => {
  for (const item of sidebar) {
    const result = traverseSidebarItem(item, callback);
    if (result !== undefined) return result;
  }
};

export const traverseSidebarItem = <T>(
  item: SidebarItem,
  callback: TraverseCallback<T>,
  parentCategories: SidebarItem[] = [],
): T | undefined => {
  const result = callback(item, parentCategories);
  if (result !== undefined) return result;

  if (item.type === "category") {
    for (const child of item.items) {
      const childResult = traverseSidebarItem(child, callback, [
        ...parentCategories,
        item,
      ]);
      if (childResult !== undefined) return childResult;
    }
  }
};

export const useCurrentItem = () => {
  const location = useLocation();
  const nav = useCurrentNavigation();

  const currentSidebar = nav.sidebar;

  return traverseSidebar(currentSidebar, (item) => {
    if (item.type === "doc" && joinPath(item.id) === location.pathname) {
      return item;
    }
  });
};

export const useIsCategoryOpen = (category: SidebarItemCategory) => {
  const location = useLocation();

  return traverseSidebarItem(category, (item) => {
    if (item.type === "category" && item.link) {
      const categoryLinkPath = joinPath(item.link.id);
      if (categoryLinkPath === location.pathname) {
        return true;
      }
    }

    if (item.type === "doc") {
      const docPath = joinPath(item.id);
      if (docPath === location.pathname) {
        return true;
      }
    }
  });
};

export const usePrevNext = (): {
  prev?: { label: string; id: string };
  next?: { label: string; id: string };
} => {
  const currentId = useLocation().pathname;
  const nav = useCurrentNavigation();
  const currentSidebar = nav.sidebar;

  let prev;
  let next;

  let foundCurrent = false;

  traverseSidebar(currentSidebar, (item) => {
    const itemId =
      item.type === "doc"
        ? joinPath(item.id)
        : item.type === "category" && item.link
          ? joinPath(item.link.id)
          : undefined;

    if (!itemId) return;

    if (foundCurrent) {
      next = { label: item.label, id: itemId };
      return true;
    }

    if (currentId === itemId) {
      foundCurrent = true;
    } else {
      prev = { label: item.label, id: itemId };
    }
  });

  return { prev, next };
};
