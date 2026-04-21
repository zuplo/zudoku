import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { SearchIcon, XIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "zudoku/components";
import { Card, CardContent, CardHeader } from "zudoku/ui/Card.js";
import { useAuthState } from "../../authentication/state.js";
import { Heading } from "../../components/Heading.js";
import { useHotkey } from "../../hooks/useHotkey.js";
import { Badge } from "../../ui/Badge.js";
import { Button } from "../../ui/Button.js";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../../ui/InputGroup.js";
import { Kbd } from "../../ui/Kbd.js";
import { ToggleGroup, ToggleGroupItem } from "../../ui/ToggleGroup.js";
import { joinUrl } from "../../util/joinUrl.js";
import { sanitizeMarkdownForMetatag } from "../openapi/util/sanitizeMarkdownForMetatag.js";
import type { ApiCatalogItem, ApiCatalogPluginOptions } from "./index.js";

const getAvatarLetter = (label: string) =>
  label.trim().charAt(0).toUpperCase() || "?";

const matchesQuery = (item: ApiCatalogItem, query: string) => {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    item.label.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.categories.some(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    )
  );
};

const ALL_ITEMS = "all";

export const Catalog = ({
  items,
  filterCatalogItems = (items) => items,
  label = "API Library",
}: Omit<ApiCatalogPluginOptions, "path">) => {
  const auth = useAuthState();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>(ALL_ITEMS);
  const inputRef = useRef<HTMLInputElement>(null);

  const catalogItems = useSuspenseQuery({
    queryFn: () => filterCatalogItems(items, { auth }),
    queryKey: ["catalogItems", auth],
  });

  const filterChips = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const item of catalogItems.data) {
      for (const cat of item.categories) {
        if (!seen.has(cat.label)) {
          seen.add(cat.label);
          ordered.push(cat.label);
        }
      }
    }
    return ordered;
  }, [catalogItems.data]);

  const visibleItems = useMemo(
    () =>
      catalogItems.data.filter((item) => {
        if (
          activeFilter !== ALL_ITEMS &&
          !item.categories.some((c) => c.label === activeFilter)
        ) {
          return false;
        }

        return matchesQuery(item, query);
      }),
    [catalogItems.data, query, activeFilter],
  );

  const totalOps = useMemo(
    () =>
      catalogItems.data.reduce((sum, i) => sum + (i.operationCount ?? 0), 0),
    [catalogItems.data],
  );

  useHotkey("slash", () => {
    inputRef.current?.focus();
    inputRef.current?.select();
  });

  return (
    <section className="pt-(--padding-content-top) pb-12">
      <Helmet>
        <title>{label}</title>
      </Helmet>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Heading level={1} className="text-4xl font-bold tracking-tight">
            {label}
          </Heading>
          <p className="text-muted-foreground text-base">
            Browse every API across the platform. {catalogItems.data.length}{" "}
            {catalogItems.data.length === 1 ? "API" : "APIs"}
            {totalOps > 0 ? ` · ${totalOps} endpoints` : ""}.
          </p>
        </header>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <InputGroup className="max-w-md">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search APIs…"
              aria-label="Search APIs"
            />
            <InputGroupAddon align="inline-end">
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-4" />
                </button>
              ) : (
                <Kbd>/</Kbd>
              )}
            </InputGroupAddon>
          </InputGroup>

          {filterChips.length > 0 && (
            <ToggleGroup
              size="sm"
              variant="outline"
              aria-label="Filter by category"
              spacing={2}
              value={activeFilter ? [activeFilter] : [""]}
              onValueChange={(value: string[]) =>
                setActiveFilter(value.at(0) ?? ALL_ITEMS)
              }
            >
              <ToggleGroupItem value={ALL_ITEMS}>All</ToggleGroupItem>
              {filterChips.map((chip) => (
                <ToggleGroupItem key={chip} value={chip}>
                  {chip}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </div>

        {visibleItems.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground text-sm">
              No APIs match your filters.
            </p>
            {(query || activeFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setQuery("");
                  setActiveFilter(ALL_ITEMS);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((api) => (
              <CatalogCard key={api.path} item={api} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const CatalogCard = ({ item }: { item: ApiCatalogItem }) => {
  const tags = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const cat of item.categories) {
      for (const tag of [cat.label, ...cat.tags]) {
        if (!seen.has(tag)) {
          seen.add(tag);
          out.push(tag);
        }
      }
    }
    return out;
  }, [item.categories]);

  return (
    <Link to={joinUrl(item.path)} className="group ">
      <Card>
        <CardHeader className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg text-base font-semibold">
            {getAvatarLetter(item.label)}
          </div>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-semibold leading-tight">{item.label}</span>
            </div>
            {item.version && (
              <span className="text-muted-foreground bg-muted shrink-0 rounded-md px-2 py-0.5 text-xs font-medium">
                {item.version}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {sanitizeMarkdownForMetatag(item.description, 240)}
          </p>
          <div className="border-t mt-2 pt-2">
            {(tags.length > 0 || item.operationCount != null) && (
              <div className="mt-auto flex items-center justify-between gap-2 ">
                <div className="flex flex-wrap items-center gap-1.5">
                  {tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="muted" className="font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {item.operationCount != null && (
                  <span className="text-muted-foreground shrink-0 text-xs font-medium">
                    {item.operationCount} ops
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
