import slugify from "@sindresorhus/slugify";
import { matchPath } from "react-router";
import type { SidebarItem } from "../../../config/validators/SidebarSchema.js";
import type { AuthState } from "../../authentication/state.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import { joinUrl } from "../../util/joinUrl.js";
import { Catalog } from "./Catalog.js";

export const getKey = (category: string, tag: string) =>
  slugify(`${category}-${tag}`);

export type ApiCatalogItem = {
  path: string;
  label: string;
  description: string;
  categories: CatalogCategory[];
};

export type CatalogCategory = {
  label: string;
  tags: string[];
};

export type ApiCatalogPluginOptions = {
  navigationId: string;
  label: string;
  categories?: CatalogCategory[];
  items: ApiCatalogItem[];
  filterCatalogItems?: filterCatalogItems;
};

export type CatalogContext<ProviderData = unknown> = {
  auth: AuthState<ProviderData>;
};

export type filterCatalogItems<ProviderData = unknown> = (
  items: ApiCatalogItem[],
  { auth }: CatalogContext<ProviderData>,
) => ApiCatalogItem[];

export const apiCatalogPlugin = ({
  navigationId,
  items,
  label,
  categories = [],
  filterCatalogItems,
}: {
  navigationId: string;
  label: string;
  categories?: CatalogCategory[];
  items: ApiCatalogItem[];
  filterCatalogItems?: filterCatalogItems;
}): ZudokuPlugin => {
  const paths = Object.fromEntries(
    categories.flatMap((category) =>
      [undefined, ...category.tags].map((tag) => [
        joinUrl(navigationId, tag ? getKey(category.label, tag) : undefined),
        tag,
      ]),
    ),
  );

  return {
    getSidebar: async (currentPath) => {
      const matches = Object.keys(paths).some((path) =>
        matchPath(path, currentPath),
      );

      if (!matches) {
        return [];
      }

      const sidebar: SidebarItem[] = categories.map((category) => ({
        type: "category" as const,
        label: category.label,
        collapsible: false,
        items: category.tags.map((tag) => ({
          type: "doc" as const,
          id: joinUrl(navigationId, getKey(category.label, tag)),
          label: tag,
          badge: {
            label: String(
              items.filter((api) =>
                api.categories.find((c) => c.tags.includes(tag)),
              ).length,
            ),
            color: "outline" as const,
          },
        })),
      }));

      sidebar.unshift({
        type: "doc" as const,
        id: joinUrl(navigationId),
        label: "Overview",
        badge: { label: String(items.length), color: "outline" as const },
      });

      return sidebar;
    },
    getRoutes: () =>
      Object.entries(paths).map(([path, tag]) => ({
        path,
        element: (
          <Catalog
            label={label}
            categoryLabel={tag}
            items={items}
            filterCatalogItems={filterCatalogItems}
            categories={categories}
          />
        ),
      })),
  };
};
