import { cva } from "class-variance-authority";
import { useLocation } from "react-router";
import type {
  NavigationCategory,
  NavigationItem,
} from "../../../config/validators/NavigationSchema.js";
import { joinUrl } from "../../util/joinUrl.js";
import { useCurrentNavigation } from "../context/ZudokuContext.js";

export type TraverseCallback<T> = (
  item: NavigationItem,
  parentCategories: NavigationItem[],
) => T | void;

export const traverseNavigation = <T>(
  navigation: NavigationItem[],
  callback: TraverseCallback<T>,
): T | undefined => {
  for (const item of navigation) {
    const result = traverseNavigationItem(item, callback);
    if (result !== undefined) return result;
  }
};

export const traverseNavigationItem = <T>(
  item: NavigationItem,
  callback: TraverseCallback<T>,
  parentCategories: NavigationItem[] = [],
): T | undefined => {
  const result = callback(item, parentCategories);
  if (result !== undefined) return result;

  if (item.type === "category") {
    for (const child of item.items) {
      const childResult = traverseNavigationItem(child, callback, [
        ...parentCategories,
        item,
      ]);
      if (childResult !== undefined) return childResult;
    }
  }
};

export const useCurrentItem = () => {
  const location = useLocation();
  const { navigation } = useCurrentNavigation();

  return traverseNavigation(navigation, (item) => {
    if (item.type === "doc" && joinUrl(item.path) === location.pathname) {
      return item;
    }
  });
};

export const useIsCategoryOpen = (category: NavigationCategory) => {
  const location = useLocation();

  return traverseNavigationItem(category, (item) => {
    if (item.type === "category" && item.link) {
      const categoryLinkPath = joinUrl(item.link.path);
      if (categoryLinkPath === location.pathname) {
        return true;
      }
    }

    if (item.type === "doc") {
      const docPath = joinUrl(item.path);
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
  const { navigation } = useCurrentNavigation();

  let prev;
  let next;

  let foundCurrent = false;

  traverseNavigation(navigation, (item) => {
    const itemId =
      item.type === "doc"
        ? joinUrl(item.path)
        : item.type === "category" && item.link
          ? joinUrl(item.link.path)
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

export const navigationListItem = cva(
  "relative flex items-center gap-2 px-(--padding-nav-item) my-0.5 py-1.5 rounded-lg hover:bg-accent tabular-nums",
  {
    variants: {
      isActive: {
        true: "bg-accent font-medium",
        false: "text-foreground/80",
      },
      isMuted: {
        true: "text-foreground/30",
        false: "",
      },
      isPending: {
        true: "bg-accent animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export const isHiddenItem =
  (isAuthenticated?: boolean) =>
  (item: NavigationItem): boolean => {
    if (item.display === "hide") return false;
    if (!item.label) return false;

    return (
      (item.display === "auth" && isAuthenticated) ||
      (item.display === "anon" && !isAuthenticated) ||
      !item.display ||
      item.display === "always"
    );
  };
