import type { AuthState } from "../../authentication/state.js";
import type { ZudokuPlugin } from "../../core/plugins.js";

export type ApiCatalogItem = {
  path: string;
  label: string;
  description: string;
  categories: CatalogCategory[];
  version?: string;
  operationCount?: number;
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

export type CatalogContext = {
  auth: AuthState;
};

export type FilterCatalogItemsFn = (
  items: ApiCatalogItem[],
  { auth }: CatalogContext,
) => ApiCatalogItem[];

export const apiCatalogPlugin = ({
  path,
  items,
  label,
  categories = [],
  filterCatalogItems,
}: ApiCatalogPluginOptions): ZudokuPlugin => {
  return {
    getRoutes: () => [
      {
        path,
        async lazy() {
          const { Catalog } = await import("./Catalog.js");
          return {
            element: (
              <Catalog
                label={label}
                items={items}
                filterCatalogItems={filterCatalogItems}
                categories={categories}
              />
            ),
          };
        },
      },
    ],
  };
};
