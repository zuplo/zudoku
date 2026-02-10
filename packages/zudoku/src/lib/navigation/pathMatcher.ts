import type { NavigationItem } from "../../config/validators/NavigationSchema.js";

type PathSegment =
  | { type: "label"; value: string }
  | { type: "index"; value: number };

export type PathMatchResult =
  | undefined
  | {
      item: NavigationItem;
      parentItems: NavigationItem[];
      index: number;
    };

const parseSegment = (segment: string): PathSegment => {
  const num = Number(segment);
  if (Number.isInteger(num)) return { type: "index", value: num };
  return { type: "label", value: segment };
};

const splitPathSegments = (path: string): string[] =>
  path.split("/").filter(Boolean);

const matchesSegment = (
  segment: PathSegment,
  item: NavigationItem,
  index: number,
  length: number,
): boolean => {
  switch (segment.type) {
    case "index": {
      const normalized =
        segment.value < 0 ? length + segment.value : segment.value;
      return normalized === index;
    }
    case "label":
      return item.label?.toLowerCase() === segment.value.toLowerCase();
  }
};

export const findByPath = (
  navigation: NavigationItem[],
  pathString: string,
): PathMatchResult => {
  if (!pathString || pathString === "/") return undefined;

  const segments = splitPathSegments(pathString).map(parseSegment);
  if (segments.length === 0) return undefined;

  let currentItems = navigation;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) return undefined;

    const foundIndex = currentItems.findIndex((item, idx) =>
      matchesSegment(segment, item, idx, currentItems.length),
    );

    if (foundIndex === -1) return undefined;
    const item = currentItems[foundIndex];
    if (!item) return undefined;

    if (i === segments.length - 1) {
      return {
        item,
        parentItems: currentItems,
        index: foundIndex,
      };
    }

    if (item.type !== "category") return undefined;
    currentItems = item.items;
  }
};
