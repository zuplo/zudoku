import slugify from "@sindresorhus/slugify";
import { Fragment } from "react";
import { Head, Link } from "zudoku/components";
import { Markdown } from "../../components/Markdown.js";
import { useExposedProps } from "../../util/useExposedProps.js";
import type { ApiCatalogItem, CatalogCategory } from "./index.js";

export const Catalog = ({
  items,
  categories,
  label = "API Library",
}: {
  label: string;
  items: ApiCatalogItem[];
  categories: CatalogCategory[];
}) => {
  const { searchParams, setSearchParams } = useExposedProps();
  const activeCategory = searchParams.get("category");
  return (
    <section className="pt-[--padding-content-top] pb-[--padding-content-bottom]">
      <Head>
        <title>{label}</title>
      </Head>
      <div className="grid grid-cols-12 gap-12">
        <div className="flex flex-col gap-4 col-span-3 px-4 not-prose sticky top-48">
          <div className="justify-between">
            {categories.map((category, idx) => (
              <Fragment key={category.label}>
                <div className="flex justify-between mb-2.5">
                  <span className="font-medium text-sm">{category.label}</span>
                  {idx === 0 && activeCategory && (
                    <button
                      type="button"
                      className="text-end text-sm mr-8 text-foreground/60 hover:text-foreground"
                      onClick={() => setSearchParams({})}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <ul className="space-y-1 [&>li]:py-2">
                  {Array.from(
                    new Set(
                      category.tags
                        .map((tag) => ({
                          tag,
                          count: items.filter((api) =>
                            api.categories.find((c) => c.tags.includes(tag)),
                          ).length,
                        }))
                        .map(({ tag, count }) => (
                          <li
                            key={slugify(category.label + " " + tag)}
                            className={`flex px-4 rounded-lg -translate-x-4 justify-between text-sm cursor-pointer hover:text-primary transition ${
                              slugify(tag) === activeCategory
                                ? "font-medium bg-border/30 rounded"
                                : ""
                            }`}
                            onClick={() =>
                              setSearchParams({
                                category: slugify(category.label + " " + tag),
                              })
                            }
                          >
                            <span>{tag}</span>
                            <span
                              className={`flex items-center justify-center border rounded-md w-8 text-xs font-semibold ${
                                slugify(tag) === activeCategory
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : ""
                              }`}
                            >
                              {count}
                            </span>
                          </li>
                        )),
                    ),
                  )}
                </ul>
              </Fragment>
            ))}
          </div>
        </div>
        <div className="col-span-9">
          <h3 className="mt-0 text-2xl font-bold mb-4">{label}</h3>

          <div className="grid grid-cols-2 gap-4">
            {items
              .filter(
                (api) =>
                  !activeCategory ||
                  api.categories.find((c) =>
                    c.tags.find(
                      (t) => slugify(c.label + " " + t) === activeCategory,
                    ),
                  ),
              )
              .map((api, i) => (
                <Link
                  to={{
                    pathname: `/${api.path}`,
                    search: activeCategory ? `category=${activeCategory}` : "",
                  }}
                  className="no-underline hover:!text-foreground"
                  key={api.path}
                >
                  <div
                    className="border h-full rounded p-4 flex flex-col gap-2 cursor-pointer hover:bg-border/20 font-normal"
                    key={i}
                  >
                    <span className="font-semibold">{api.label}</span>
                    <Markdown
                      className="text-sm whitespace-pre-wrap mb-6 line-clamp-2"
                      content={api.description}
                    />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};
