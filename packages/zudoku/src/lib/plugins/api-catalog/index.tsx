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
};

export const apiCatalogPlugin = ({
  navigationId,
  items,
  label,
  categories,
}: {
  navigationId: string;
  label: string;
  categories?: CatalogCategory[];
  items: ApiCatalogItem[];
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
              categories={categories ?? []}
            />
          ),
        },
      ];
    },
  };
};
