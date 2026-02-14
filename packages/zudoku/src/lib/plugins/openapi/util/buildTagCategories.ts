import type { NavigationItem } from "../../../../config/validators/NavigationSchema.js";

type TagGroup = { name: string; tags: string[] };

type BuildTagCategoriesOptions = {
  tagCategories: Map<string, NavigationItem>;
  tagGroups: TagGroup[];
  expandAllTags?: boolean;
};

// Merges tags and x-tagGroups with the same name into a single sidebar
// category (mimics OpenAPI 3.2.0 "Enhanced tags" behaviour).
export const buildTagCategories = ({
  tagCategories,
  tagGroups,
  expandAllTags,
}: BuildTagCategoriesOptions): NavigationItem[] => {
  const consumedTags = new Set<string>();

  const groupedCategories = tagGroups.flatMap<NavigationItem>((group) => {
    // Use a same-named tag as base so its operations appear first
    const matchingTag = tagCategories.get(group.name);
    const base = matchingTag?.type === "category" ? matchingTag : undefined;

    if (base) consumedTags.add(group.name);

    // Exclude group's own name to avoid nesting a tag inside itself
    const childTags = group.tags.flatMap((name) => {
      if (name === group.name) return [];
      const tag = tagCategories.get(name);
      if (!tag) return [];
      consumedTags.add(name);
      return tag;
    });

    if (!base && childTags.length === 0) return [];

    return {
      ...base,
      type: "category",
      label: base?.label ?? group.name,
      items: [...(base?.items ?? []), ...childTags],
      collapsible: base?.collapsible ?? true,
      collapsed: base?.collapsed ?? !expandAllTags,
    };
  });

  // Tags not claimed by any group appear as standalone entries
  const ungroupedCategories = Array.from(tagCategories.entries())
    .filter(([name]) => !consumedTags.has(name))
    .map(([, cat]) => cat);

  return [...groupedCategories, ...ungroupedCategories];
};
