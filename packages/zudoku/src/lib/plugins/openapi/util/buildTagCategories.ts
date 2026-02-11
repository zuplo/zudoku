import type { NavigationItem } from "../../../../config/validators/NavigationSchema.js";

type TagGroup = { name: string; tags: string[] };

type BuildTagCategoriesOptions = {
  tagCategories: Map<string, NavigationItem>;
  tagGroups: TagGroup[];
  expandAllTags?: boolean;
};

export const buildTagCategories = ({
  tagCategories,
  tagGroups,
  expandAllTags,
}: BuildTagCategoriesOptions): NavigationItem[] => {
  const groupedTags = new Set(
    tagGroups.flatMap((group) =>
      group.tags.filter((name) => tagCategories.has(name)),
    ),
  );

  const groupedCategories: NavigationItem[] = tagGroups.flatMap((group) => {
    const items = group.tags
      .map((name) => tagCategories.get(name))
      .filter(Boolean) as NavigationItem[];

    if (items.length === 0) {
      return [];
    }
    return [
      {
        type: "category",
        label: group.name,
        items,
        collapsible: true,
        collapsed: !expandAllTags,
      },
    ];
  });

  const ungroupedCategories = Array.from(tagCategories.entries())
    .filter(([name]) => !groupedTags.has(name))
    .map(([, cat]) => cat);

  return [...groupedCategories, ...ungroupedCategories].sort((a, b) =>
    (a.label ?? "").localeCompare(b.label ?? ""),
  );
};
