import slugify from "@sindresorhus/slugify";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { Head, Link } from "zudoku/components";
import { useAuthState } from "../../authentication/state.js";
import { Markdown } from "../../components/Markdown.js";
import { cn } from "../../util/cn.js";
import type { ApiCatalogPluginOptions } from "./index.js";

const getKey = (category: string, tag: string) => slugify(`${category}-${tag}`);

export const Catalog = ({
  items,
  filterCatalogItems = (items) => items,
  categories,
  label = "API Library",
}: Omit<ApiCatalogPluginOptions, "navigationId">) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const auth = useAuthState();

  const catalogItems = useSuspenseQuery({
    queryFn: () => filterCatalogItems(items, { auth }),
    queryKey: ["catalogItems", auth],
  });

  return (
    <section className="pt-[--padding-content-top] pb-[--padding-content-bottom]">
      <Head>
        <title>{label}</title>
      </Head>
      <div className="grid grid-cols-12 gap-12">
        <div className="flex flex-col gap-4 col-span-3 not-prose sticky top-48">
          <div className="max-w-[--side-nav-width] flex flex-col gap-4 justify-between">
            {categories?.map((category, idx) => (
              <div key={category.label}>
                <div className="flex justify-between mb-2.5">
                  <span className="font-medium text-sm">{category.label}</span>
                  {idx === 0 && activeCategory && (
                    <button
                      type="button"
                      className="text-end text-sm text-foreground/60 hover:text-foreground"
                      onClick={() => setSearchParams({})}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <ul className="space-y-1 [&>li]:py-2">
                  {category.tags
                    .map((tag) => ({
                      tag,
                      count: items.filter((api) =>
                        api.categories.find((c) => c.tags.includes(tag)),
                      ).length,
                    }))
                    .map(({ tag, count }) => {
                      const slug = getKey(category.label, tag);
                      const isActive = slug === activeCategory;

                      return (
                        <li
                          key={slug}
                          className={cn(
                            "flex rounded-lg justify-between text-sm cursor-pointer hover:text-primary transition px-[--padding-nav-item] -mx-[--padding-nav-item]",
                            isActive && "bg-border/30 rounded",
                          )}
                          onClick={() => setSearchParams({ category: slug })}
                        >
                          <span>{tag}</span>
                          <span
                            className={cn(
                              "flex items-center justify-center border rounded-md w-8 text-xs font-semibold",
                              isActive &&
                                "bg-primary border-primary text-primary-foreground",
                            )}
                          >
                            {count}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-9">
          <h3 className="mt-0 text-2xl font-bold mb-4">{label}</h3>

          <div className="grid grid-cols-2 gap-4">
            {catalogItems.data
              .filter(
                (api) =>
                  !activeCategory ||
                  api.categories.find((c) =>
                    c.tags.find((t) => getKey(c.label, t) === activeCategory),
                  ),
              )
              .map((api) => (
                <Link
                  to={{
                    pathname: `/${api.path}`,
                    search: activeCategory ? `category=${activeCategory}` : "",
                  }}
                  className="no-underline hover:!text-foreground"
                  key={api.path}
                >
                  <div className="border h-full rounded p-4 flex flex-col gap-2 cursor-pointer hover:bg-border/20 font-normal">
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
