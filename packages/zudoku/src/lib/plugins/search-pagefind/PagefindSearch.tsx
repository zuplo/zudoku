import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "zudoku/ui/Command.js";
import { DialogTitle } from "zudoku/ui/Dialog.js";
import type { PagefindOptions } from "./index.js";
import { Pagefind, PagefindSubResult } from "./types.js";

const DEFAULT_RANKING = {
  // Slightly lower than default because API docs tend to have repetitive terms (parameter names, HTTP methods, etc.)
  termFrequency: 0.8,
  // Lower than default because API documentation pages tend to be longer due to comprehensive endpoint documentation
  pageLength: 0.6,
  // Slightly higher than default because in technical documentation, exact matches should be prioritized
  termSimilarity: 1.2,
  // Slightly lower than default because API docs might have legitimate repetition of terms
  termSaturation: 1.2,
};

const usePagefind = (options: PagefindOptions) => {
  const { data: pagefind, ...rest } = useQuery<Pagefind>({
    queryKey: ["pagefind", options.ranking],
    queryFn: async () => {
      return await import(
        /* @vite-ignore */ `${location.origin}/pagefind/pagefind.js`
      ).then(async (pagefind: Pagefind) => {
        await pagefind.init();
        await pagefind.options({
          ranking: {
            termFrequency:
              options.ranking?.termFrequency ?? DEFAULT_RANKING.termFrequency,
            pageLength:
              options.ranking?.pageLength ?? DEFAULT_RANKING.pageLength,
            termSimilarity:
              options.ranking?.termSimilarity ?? DEFAULT_RANKING.termSimilarity,
            termSaturation:
              options.ranking?.termSaturation ?? DEFAULT_RANKING.termSaturation,
          },
        });

        return pagefind;
      });
    },
    enabled: typeof window !== "undefined",
  });

  return { ...rest, pagefind };
};

const sortSubResults = (a: PagefindSubResult, b: PagefindSubResult) => {
  const aScore = a.weighted_locations.reduce(
    (sum, loc) => sum + loc.balanced_score,
    0,
  );
  const bScore = b.weighted_locations.reduce(
    (sum, loc) => sum + loc.balanced_score,
    0,
  );
  return bScore - aScore;
};

export const PagefindSearch = ({
  isOpen,
  onClose,
  options,
}: {
  isOpen: boolean;
  onClose: () => void;
  options: PagefindOptions;
}) => {
  const { pagefind } = usePagefind(options);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["pagefind-search", searchTerm],
    queryFn: async () => {
      const search = await pagefind?.search(searchTerm);
      return Promise.all(
        search?.results.slice(0, 3).map((subResult) => subResult.data()) ?? [],
      );
    },
    enabled: !!pagefind && !!searchTerm,
  });

  return (
    <CommandDialog
      command={{ shouldFilter: false }}
      open={isOpen}
      onOpenChange={onClose}
    >
      <VisuallyHidden>
        <DialogTitle>Search</DialogTitle>
      </VisuallyHidden>
      <CommandInput
        placeholder="Search..."
        value={searchTerm}
        onValueChange={(e) => setSearchTerm(e)}
      />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        {searchResults?.map((result, i) => (
          <CommandGroup
            heading={result.meta.title ?? "" + i}
            key={[result.meta.title, result.meta.url, result.excerpt]
              .filter(Boolean)
              .join("-")}
          >
            {result.sub_results
              .sort(sortSubResults)
              .slice(0, 3)
              .map((subResult) => (
                <CommandItem
                  key={result.meta.title + subResult.url + subResult.excerpt}
                  className="flex flex-col items-start"
                  onSelect={() => {
                    void navigate(subResult.url.replace(".html", ""));
                    onClose();
                  }}
                >
                  <span className="font-bold">{subResult.title}</span>
                  <span
                    className="text-xs"
                    dangerouslySetInnerHTML={{ __html: subResult.excerpt }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {subResult.url}
                  </span>
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
