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
  const consumedTags = new Set<string>();

  const groupedCategories: NavigationItem[] = tagGroups.flatMap((group) => {
    const matchingTag = tagCategories.get(group.name);
    const base = matchingTag?.type === "category" ? matchingTag : undefined;

    if (base) consumedTags.add(group.name);

    const childTags = group.tags
      .filter((name) => name !== group.name && tagCategories.has(name))
      .flatMap((name) => {
        consumedTags.add(name);
        const tag = tagCategories.get(name);
        return tag ? [tag] : [];
      });

    if (!base && childTags.length === 0) return [];

    return [
      {
        ...base,
        type: "category" as const,
        label: base?.label ?? group.name,
        items: [...(base?.items ?? []), ...childTags],
        collapsible: base?.collapsible ?? true,
        collapsed: base?.collapsed ?? !expandAllTags,
      },
    ];
  });

  const ungroupedCategories = Array.from(tagCategories.entries())
    .filter(([name]) => !consumedTags.has(name))
    .map(([, cat]) => cat);

  return [...groupedCategories, ...ungroupedCategories];
};
