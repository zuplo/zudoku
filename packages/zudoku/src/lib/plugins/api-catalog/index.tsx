import slugify from "@sindresorhus/slugify";
import { matchPath } from "react-router";
import type { NavigationItem } from "../../../config/validators/NavigationSchema.js";
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
  path: string;
  label: string;
  categories?: CatalogCategory[];
  items: ApiCatalogItem[];
  filterCatalogItems?: FilterCatalogItemsFn;
};

export type CatalogContext<ProviderData = unknown> = {
  auth: AuthState<ProviderData>;
};

export type FilterCatalogItemsFn<ProviderData = unknown> = (
  items: ApiCatalogItem[],
  { auth }: CatalogContext<ProviderData>,
) => ApiCatalogItem[];

export const apiCatalogPlugin = ({
  path,
  items,
  label,
  categories = [],
  filterCatalogItems,
}: {
  path: string;
  label: string;
  categories?: CatalogCategory[];
  items: ApiCatalogItem[];
  filterCatalogItems?: FilterCatalogItemsFn;
}): ZudokuPlugin => {
  const paths = Object.fromEntries(
    categories.flatMap((category) =>
      [undefined, ...category.tags].map((tag) => [
        joinUrl(path, tag ? getKey(category.label, tag) : undefined),
        tag,
      ]),
    ),
  );

  return {
    getNavigation: async (currentPath) => {
      const matches = Object.keys(paths).some((path) =>
        matchPath(path, currentPath),
      );

      if (!matches) {
        return [];
      }

      const navigation: NavigationItem[] = categories.map((category) => ({
        type: "category",
        label: category.label,
        collapsible: false,
        items: category.tags.map((tag) => ({
          type: "link",
          to: joinUrl(path, getKey(category.label, tag)),
          label: tag,
          badge: {
            label: String(
              items.filter((api) =>
                api.categories.find((c) => c.tags.includes(tag)),
              ).length,
            ),
            color: "outline",
          },
        })),
      }));

      navigation.unshift({
        type: "link",
        to: joinUrl(path),
        label: "Overview",
        badge: { label: String(items.length), color: "outline" },
      });

      return navigation;
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
