import { useLocation } from "react-router";
import type {
  NavigationCategory,
  NavigationItem,
} from "../../../config/validators/NavigationSchema.js";
import { joinUrl } from "../../util/joinUrl.js";
import { useZudoku } from "../context/ZudokuContext.js";
import {
  cleanPath,
  getItemPath,
  sectionLanding,
  stackCategoryTarget,
  traverseNavigation,
  traverseNavigationItem,
} from "./utils.js";

type BackLink = { to: string; label?: string };

// What the sidebar currently shows. Normally the section's own items ("root"),
// but when you drill into a `stack` it becomes that panel's items plus a `back`
// link. `id` identifies the frame so the panel can slide on change.
export type NavigationFrame = {
  id: string;
  items: NavigationItem[];
  back?: BackLink;
};

const containsPath = (
  category: NavigationCategory,
  pathname: string,
): boolean =>
  traverseNavigationItem(category, (item) => {
    const itemPath = getItemPath(item);
    return itemPath && cleanPath(itemPath) === pathname ? true : undefined;
  }) ?? false;

// An intra-section stack: a `stack` category whose own sub-tree owns the current path.
export const findStackCategory = (
  navigation: NavigationItem[],
  pathname: string,
): NavigationCategory | undefined =>
  traverseNavigation(navigation, (item) =>
    item.type === "category" && item.stack && containsPath(item, pathname)
      ? item
      : undefined,
  );

// Resolve a back link to a section's landing page, falling back to "/".
const resolveBack = (item: NavigationItem): BackLink => {
  const to = sectionLanding(item);
  if (to) return { to, label: item.label };
  // biome-ignore lint/suspicious/noConsole: Dev-only stacked navigation misconfiguration warning
  console.warn(
    `[Zudoku] Stacked navigation: no landing path for section "${item.label}"; falling back to "/".`,
  );
  return { to: "/", label: item.label };
};

// Cross-section stack: derive the back link from the ancestor that owns the `stack` link.
export const resolveStackOwner = (
  siteNavigation: NavigationItem[],
  pathname: string,
): BackLink | undefined =>
  traverseNavigation(siteNavigation, (item, parents) => {
    if (item.type !== "link" || !item.stack) return;
    const base = cleanPath(item.to);
    if (pathname !== base && !pathname.startsWith(`${base}/`)) return;
    return resolveBack(parents.at(0) ?? item);
  });

export const resolveNavigationFrame = (
  navigation: NavigationItem[],
  siteNavigation: NavigationItem[],
  pathname: string,
  topNavItem?: NavigationItem,
): NavigationFrame => {
  const stack = findStackCategory(navigation, pathname);
  if (stack) {
    return {
      id: `stack:${stackCategoryTarget(stack) || stack.label}`,
      items: stack.items,
      back: topNavItem ? resolveBack(topNavItem) : { to: "/" },
    };
  }

  const owner = resolveStackOwner(siteNavigation, pathname);
  if (owner) {
    return { id: `ref:${owner.to}`, items: navigation, back: owner };
  }

  return { id: "root", items: navigation };
};

export const useNavigationFrame = (
  navigation: NavigationItem[],
  topNavItem?: NavigationItem,
): NavigationFrame => {
  const pathname = joinUrl(useLocation().pathname);
  const { navigation: siteNavigation } = useZudoku();

  return resolveNavigationFrame(
    navigation,
    siteNavigation,
    pathname,
    topNavItem,
  );
};
