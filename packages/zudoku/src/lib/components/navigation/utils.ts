import { cva } from "class-variance-authority";
import { useLocation } from "react-router";
import type {
  NavigationCategory,
  NavigationCategoryLink,
  NavigationItem,
} from "../../../config/validators/NavigationSchema.js";
import type { UseAuthReturn } from "../../authentication/hook.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
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

export const getCategoryLinkHref = (link: NavigationCategoryLink) =>
  link.type === "doc" ? link.path : link.to;

export const getItemPath = (item: NavigationItem) => {
  switch (item.type) {
    case "doc":
    case "custom-page":
      return joinUrl(item.path);
    case "link":
      return item.to;
    case "category":
      return item.link ? joinUrl(getCategoryLinkHref(item.link)) : undefined;
    default:
      return undefined;
  }
};

export const getFirstMatchingPath = (item: NavigationItem): string => {
  switch (item.type) {
    case "doc":
    case "custom-page":
      return joinUrl(item.path);
    case "link":
      return item.to;
    case "category": {
      if (item.link) {
        return joinUrl(getCategoryLinkHref(item.link));
      }
      return (
        traverseNavigationItem(item, (child) => {
          if (
            child.type !== "category" &&
            child.type !== "separator" &&
            child.type !== "section" &&
            child.type !== "filter"
          ) {
            return getFirstMatchingPath(child);
          }
        }) ?? ""
      );
    }
    default:
      return "";
  }
};

export const cleanPath = (path: string) =>
  joinUrl(path.split("?").at(0)?.split("#").at(0) ?? "");

// Returns the item's path or its first navigable descendant's path.
export const sectionLanding = (item: NavigationItem) =>
  getItemPath(item) ?? getFirstMatchingPath(item);

// Where a `stack` category drills to: its link target, else its first page.
export const stackCategoryTarget = (category: NavigationCategory) =>
  category.link
    ? joinUrl(getCategoryLinkHref(category.link))
    : getFirstMatchingPath(category);

export const navigationItemKey = (item: NavigationItem) =>
  item.type +
  (item.label ?? "") +
  ("path" in item ? item.path : "") +
  ("file" in item ? item.file : "") +
  ("to" in item ? item.to : "");

// Build a link's comparable href: `/path`, or `/path#fragment` when a fragment
// is present.
const hrefWithFragment = (pathname: string, fragment?: string) =>
  [joinUrl(pathname), fragment].filter(Boolean).join("#");

// Resolve a nav link's active/pending state by comparing the full href
// (incl. hash) so anchor links on the same page don't all highlight together.
export const getNavLinkState = (
  href: string,
  current: { pathname: string; activeAnchor?: string },
  pending?: { pathname: string; hash: string },
): { isActive: boolean; isPending: boolean } => {
  const hasAnchor = href.includes("#");
  return {
    isActive:
      href ===
      hrefWithFragment(
        current.pathname,
        hasAnchor ? current.activeAnchor : undefined,
      ),
    isPending: pending
      ? href === hrefWithFragment(pending.pathname, pending.hash.slice(1))
      : false,
  };
};

export const useCurrentItem = () => {
  const pathname = joinUrl(useLocation().pathname);
  const { navigation } = useCurrentNavigation();

  return traverseNavigation(navigation, (item) => {
    if (item.type === "doc" && joinUrl(item.path) === pathname) {
      return item;
    }
  });
};

export const useIsCategoryOpen = (category: NavigationCategory) => {
  const pathname = joinUrl(useLocation().pathname);

  return traverseNavigationItem(category, (item) => {
    switch (item.type) {
      case "category":
        if (!item.link) {
          return undefined;
        }
        return joinUrl(getCategoryLinkHref(item.link)) === pathname
          ? true
          : undefined;
      case "custom-page":
      case "doc":
        return joinUrl(item.path) === pathname ? true : undefined;
      case "link":
        return joinUrl(item.to) === pathname ? true : undefined;
      default:
        return undefined;
    }
  });
};

export const usePrevNext = (): {
  prev?: { label?: string; id: string };
  next?: { label?: string; id: string };
} => {
  const currentId = joinUrl(useLocation().pathname);
  const { navigation } = useCurrentNavigation();

  let prev: { label?: string; id: string } | undefined;
  let next: { label?: string; id: string } | undefined;

  let foundCurrent = false;

  traverseNavigation(navigation, (item) => {
    if (
      item.type === "separator" ||
      item.type === "section" ||
      item.type === "filter"
    )
      return;

    const itemId =
      item.type === "doc"
        ? joinUrl(item.path)
        : item.type === "category" && item.link
          ? joinUrl(getCategoryLinkHref(item.link))
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
  "relative flex items-center gap-2 px-(--padding-nav-item) my-px py-1.5 rounded-lg hover:bg-accent tabular-nums",
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

export const itemMatchesFilter = (
  item: NavigationItem,
  query: string,
): boolean => {
  if (["separator", "section", "filter"].includes(item.type)) {
    return true;
  }
  if (item.label?.toLowerCase().includes(query.toLowerCase())) {
    return true;
  }

  if (item.type === "category") {
    return item.items.some((child) => itemMatchesFilter(child, query));
  }

  return false;
};

export const shouldShowItem =
  ({
    auth,
    context,
    filterQuery,
  }: {
    auth: UseAuthReturn;
    context: ZudokuContext;
    filterQuery?: string;
  }) =>
  (item: NavigationItem): boolean => {
    if (item.type === "filter") return true;

    if (filterQuery?.trim() && !itemMatchesFilter(item, filterQuery)) {
      return false;
    }

    if (typeof item.display === "function") {
      return item.display({ context, auth });
    }

    if (item.display === "hide") return false;
    if (!item.label) return false;

    return (
      (item.display === "auth" && auth.isAuthenticated) ||
      (item.display === "anon" && !auth.isAuthenticated) ||
      !item.display ||
      item.display === "always"
    );
  };
