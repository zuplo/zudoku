import type { AtPosition } from "../../config/validators/InputNavigationSchema.js";
import type {
  NavigationCategory,
  NavigationCustomPage,
  NavigationDoc,
  NavigationItem,
  NavigationLink,
} from "../../config/validators/NavigationSchema.js";
import { findByPath } from "./pathMatcher.js";

type PositionedItem = (
  | NavigationDoc
  | NavigationLink
  | NavigationCustomPage
  | NavigationCategory
) & { at: AtPosition };

export const isPositionedItem = (
  item: NavigationItem,
): item is PositionedItem => "at" in item && item.at !== undefined;

const cloneWithoutPositioned = (items: NavigationItem[]): NavigationItem[] =>
  items.flatMap<NavigationItem>((item) =>
    isPositionedItem(item)
      ? []
      : item.type === "category"
        ? { ...item, items: cloneWithoutPositioned(item.items) }
        : { ...item },
  );

export const extractPositionedItems = (
  navigation: NavigationItem[],
): PositionedItem[] => {
  return navigation.flatMap((item) => {
    const nested =
      item.type === "category" ? extractPositionedItems(item.items) : [];

    return isPositionedItem(item) ? [item, ...nested] : nested;
  });
};

const removeAt = ({ at: _at, ...item }: PositionedItem): NavigationItem => item;

const insertItem = (
  navigation: NavigationItem[],
  item: PositionedItem,
): NavigationItem[] => {
  const match = findByPath(navigation, item.at.path);

  if (!match.found || !match.parentItems || match.index === undefined) {
    // biome-ignore lint/suspicious/noConsole: Intentional warning for positioning debug
    console.warn(
      `Navigation positioning: target path "${item.at.path}" not found, keeping item in place`,
    );

    return [...navigation, removeAt(item)];
  }

  const insertIndex =
    item.at.position === "before" ? match.index : match.index + 1;

  match.parentItems.splice(insertIndex, 0, removeAt(item));

  return navigation;
};

export const repositionItems = (
  navigation: NavigationItem[],
): NavigationItem[] => {
  const itemsToPosition = extractPositionedItems(navigation);

  if (itemsToPosition.length === 0) return navigation;

  return itemsToPosition.reduce(
    (result, item) => insertItem(result, item),
    cloneWithoutPositioned(navigation),
  );
};

// Filter and normalize positioned items for the current section
// Only keeps items whose paths start with topNavLabel, then strips that prefix
const filterAndNormalizePaths = (
  items: PositionedItem[],
  topNavLabel?: string,
): PositionedItem[] => {
  if (!topNavLabel) return items;

  const normalizedLabel = topNavLabel.toLowerCase();

  return items.flatMap((item) => {
    const [firstSegment, ...rest] = item.at.path.split("/");
    if (firstSegment?.toLowerCase() === normalizedLabel) {
      return { ...item, at: { ...item.at, path: rest.join("/") } };
    }
    return [];
  });
};

// Merge positioned items from rootNavigation into baseNavigation
// Normalizes paths to handle top-level category nesting
export const mergePositionedItems = (
  baseNavigation: NavigationItem[],
  rootNavigation: NavigationItem[],
  topNavLabel?: string,
): NavigationItem[] => {
  const itemsToPosition = extractPositionedItems(rootNavigation);
  const normalizedItems = filterAndNormalizePaths(itemsToPosition, topNavLabel);
  const combined = [...baseNavigation, ...normalizedItems];

  return repositionItems(combined);
};
