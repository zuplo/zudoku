import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { useMatch } from "react-router";
import { Link } from "zudoku/components";
import { useAuthState } from "../../authentication/state.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { joinUrl } from "../../util/joinUrl.js";
import { type ApiCatalogPluginOptions, getKey } from "./index.js";

export const Catalog = ({
  items,
  filterCatalogItems = (items) => items,
  label = "API Library",
  categoryLabel,
}: Omit<ApiCatalogPluginOptions, "navigationId"> & {
  categoryLabel?: string;
}) => {
  const auth = useAuthState();
  const match = useMatch({ path: "/catalog/:category" });
  const activeCategory = match?.params.category;

  const catalogItems = useSuspenseQuery({
    queryFn: () => filterCatalogItems(items, { auth }),
    queryKey: ["catalogItems", auth],
  });

  // Only index the overview page, ignore the rest
  const dataSet = activeCategory ? { "data-pagefind-ignore": "all" } : {};

  return (
    <section className="pt-[--padding-content-top]" {...dataSet}>
      <Helmet>
        <title>
          {categoryLabel ? `${categoryLabel} - ` : ""}
          {label}
        </title>
      </Helmet>
      <div className="grid gap-4">
        <Heading level={2}>
          {label}
          {categoryLabel && ` - ${categoryLabel}`}
        </Heading>

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
                to={joinUrl(api.path)}
                className="no-underline hover:!text-foreground"
                key={api.path}
              >
                <div className="border h-full rounded-lg p-4 flex flex-col gap-2 cursor-pointer hover:bg-border/20 font-normal">
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
    </section>
  );
};
