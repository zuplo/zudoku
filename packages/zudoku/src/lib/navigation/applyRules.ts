import type {
  NavigationItem,
  ResolvedNavigationRule,
  SortableNavigationItem,
} from "../../config/validators/NavigationSchema.js";
import { findByPath } from "./pathMatcher.js";

export const SORTABLE_TYPES = ["doc", "link", "category", "section"] as const;
export type SortableType = (typeof SORTABLE_TYPES)[number];

const isSortable = (item: NavigationItem): item is SortableNavigationItem =>
  SORTABLE_TYPES.some((t) => t === item.type);

export type ApplyRulesResult = {
  result: NavigationItem[];
  warnings: string[];
};

const cloneNavigation = (items: NavigationItem[]): NavigationItem[] =>
  items.map((item) =>
    item.type === "category"
      ? { ...item, items: cloneNavigation(item.items) }
      : { ...item },
  );

// Strips the top-nav prefix from a rule path if it matches the current label.
const normalizeRulePath = (rulePath: string, topNavLabel?: string) => {
  if (!topNavLabel) return rulePath;

  const segments = rulePath.split("/").filter(Boolean);
  const first = segments[0];
  if (!first) return rulePath;

  // Number segments can't match a top-nav label
  if (!Number.isNaN(Number(first))) {
    return segments.length > 1 ? undefined : rulePath;
  }

  if (first.toLowerCase() === topNavLabel.toLowerCase()) {
    const rest = segments.slice(1).join("/");
    return rest || "/";
  }

  // Multi-segment path where first segment doesn't match → different context
  if (segments.length > 1) return undefined;

  // Single segment: apply to sidebar as-is
  return rulePath;
};

export const applyRules = (
  navigation: NavigationItem[],
  rules: ResolvedNavigationRule[],
  topNavLabel?: string,
): ApplyRulesResult => {
  const result = cloneNavigation(navigation);
  const warnings: string[] = [];

  for (const rule of rules) {
    const normalizedPath = normalizeRulePath(rule.match, topNavLabel);
    if (normalizedPath === undefined) continue;

    const match = findByPath(result, normalizedPath);
    if (!match) {
      warnings.push(`Rule target "${rule.match}" not found`);
      continue;
    }

    if (match.isRoot) {
      if (rule.type === "sort") {
        result.sort((a, b) =>
          isSortable(a) && isSortable(b) ? rule.by(a, b) : 0,
        );
      } else {
        warnings.push(`Rule type "${rule.type}" cannot target the root level`);
      }
      continue;
    }

    switch (rule.type) {
      case "remove":
        match.parentItems.splice(match.index, 1);
        break;
      case "modify":
        match.parentItems[match.index] = { ...match.item, ...rule.set };
        break;
      case "insert": {
        const offset = rule.position === "after" ? 1 : 0;
        match.parentItems.splice(match.index + offset, 0, ...rule.items);
        break;
      }
      case "sort": {
        const sortableItems =
          match.item.type === "category" ? match.item.items : undefined;

        if (sortableItems) {
          sortableItems.sort((a, b) =>
            isSortable(a) && isSortable(b) ? rule.by(a, b) : 0,
          );
        } else {
          warnings.push(`Sort target "${rule.match}" is not a category`);
        }
        break;
      }
      case "move": {
        const toPath = normalizeRulePath(rule.to, topNavLabel);
        if (toPath === undefined) break;

        const [item] = match.parentItems.splice(match.index, 1);
        if (!item) break;

        const target = findByPath(result, toPath);
        if (!target || target.isRoot) {
          warnings.push(`Move target "${rule.to}" not found`);
          match.parentItems.splice(match.index, 0, item);
          break;
        }

        const offset = rule.position === "after" ? 1 : 0;
        target.parentItems.splice(target.index + offset, 0, item);
        break;
      }
    }
  }

  return { result, warnings };
};
