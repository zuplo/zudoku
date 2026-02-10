import type {
  NavigationItem,
  ResolvedNavigationRule,
  SortableNavigationItem,
} from "../../config/validators/NavigationSchema.js";
import { findByPath } from "./pathMatcher.js";

const isSortable = (item: NavigationItem): item is SortableNavigationItem =>
  item.type === "doc" ||
  item.type === "link" ||
  item.type === "category" ||
  item.type === "section";

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
// Returns null if the rule targets a different nav context.
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
        if (match.item.type === "category") {
          match.item.items.sort((a, b) =>
            isSortable(a) && isSortable(b) ? rule.by(a, b) : 0,
          );
        } else {
          warnings.push(`Sort target "${rule.match}" is not a category`);
        }
        break;
      }
    }
  }

  return { result, warnings };
};
