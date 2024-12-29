import type { AuthState } from "../../authentication/state.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import { Catalog } from "./Catalog.js";

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
  categories,
  filterCatalogItems,
}: {
  navigationId: string;
  label: string;
  categories?: CatalogCategory[];
  items: ApiCatalogItem[];
  filterCatalogItems?: filterCatalogItems;
}): ZudokuPlugin => {
  return {
    getRoutes: () => {
      return [
        {
          path: navigationId,
          element: (
            <Catalog
              label={label}
              items={items}
              filterCatalogItems={filterCatalogItems}
              categories={categories ?? []}
            />
          ),
        },
      ];
    },
  };
};
