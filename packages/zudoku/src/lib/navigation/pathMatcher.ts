import type { NavigationItem } from "../../config/validators/NavigationSchema.js";

type PathSegment = string | number;

export type PathMatchResult = {
  found: boolean;
  item?: NavigationItem;
  parentItems?: NavigationItem[];
  index?: number;
};

const parsePath = (path: string): PathSegment[] => {
  if (!path || path === "/") return [];

  return path
    .split("/")
    .filter((segment) => segment !== "")
    .map((segment) => {
      const num = Number(segment);
      return Number.isInteger(num) ? num : segment;
    });
};

const matchesSegment = (
  segment: PathSegment,
  item: NavigationItem,
  index: number,
  arrayLength: number,
): boolean => {
  if (typeof segment === "number") {
    // Support negative indices (-1 for last, -2 for second-to-last, etc.)
    const normalizedIndex = segment < 0 ? arrayLength + segment : segment;
    return normalizedIndex === index;
  }

  return item.label?.toLowerCase() === segment.toLowerCase();
};

export const findByPath = (
  navigation: NavigationItem[],
  pathString: string,
): PathMatchResult => {
  const segments = parsePath(pathString);

  if (segments.length === 0) {
    return { found: false };
  }

  let currentItems = navigation;
  let currentItem: NavigationItem | undefined;
  let parentItems: NavigationItem[] | undefined;
  let itemIndex: number | undefined;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (segment === undefined) {
      return { found: false };
    }
    const isLastSegment = i === segments.length - 1;

    const foundIndex = currentItems.findIndex((item, idx) =>
      matchesSegment(segment, item, idx, currentItems.length),
    );

    if (foundIndex === -1) {
      return { found: false };
    }

    currentItem = currentItems[foundIndex];
    if (!currentItem) {
      return { found: false };
    }

    if (isLastSegment) {
      parentItems = currentItems;
      itemIndex = foundIndex;
      break;
    }

    if (currentItem.type === "category") {
      currentItems = currentItem.items;
    } else {
      return { found: false };
    }
  }

  return {
    found: true,
    item: currentItem,
    parentItems,
    index: itemIndex,
  };
};
