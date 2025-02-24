import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Callout } from "zudoku/ui/Callout.js";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
} from "zudoku/ui/Command.js";
import { DialogTitle } from "zudoku/ui/Dialog.js";
import { joinUrl } from "../../util/joinUrl.js";
import type { PagefindOptions } from "./index.js";
import { ResultList } from "./ResultList.js";
import { Pagefind } from "./types.js";

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

const importPagefind = (): Promise<Pagefind> =>
  import.meta.env.DEV
    ? // @ts-expect-error TypeScript can't resolve the import
      import(/* @vite-ignore */ "/pagefind/pagefind.js")
    : import(
        /* @vite-ignore */ joinUrl(
          import.meta.env.BASE_URL,
          "/pagefind/pagefind.js",
        )
      );

const usePagefind = (options: PagefindOptions) => {
  const { data: pagefind, ...result } = useQuery<Pagefind>({
    queryKey: ["pagefind", options.ranking],
    retry: false,
    queryFn: async () => {
      const pagefind = await importPagefind();
      await pagefind.init();
      await pagefind.options({
        ranking: {
          termFrequency:
            options.ranking?.termFrequency ?? DEFAULT_RANKING.termFrequency,
          pageLength: options.ranking?.pageLength ?? DEFAULT_RANKING.pageLength,
          termSimilarity:
            options.ranking?.termSimilarity ?? DEFAULT_RANKING.termSimilarity,
          termSaturation:
            options.ranking?.termSaturation ?? DEFAULT_RANKING.termSaturation,
        },
      });

      return pagefind;
    },
    enabled: typeof window !== "undefined",
  });

  if (result.isError) {
    // eslint-disable-next-line no-console
    console.error(result.error);
  }

  return { ...result, pagefind };
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
  const { pagefind, error, isError } = usePagefind(options);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["pagefind-search", searchTerm],
    queryFn: async () => {
      const search = await pagefind?.search(searchTerm);
      return Promise.all(
        search?.results.slice(0, 3).map((subResult) => subResult.data()) ?? [],
      );
    },
    placeholderData: keepPreviousData,
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
        onValueChange={setSearchTerm}
        disabled={isError}
      />
      <CommandEmpty>
        {searchTerm ? "No results found." : "Start typing to search"}
      </CommandEmpty>
      {isError ? (
        <div className="p-4 text-sm">
          {error.message === "NOT_BUILT_YET" ? (
            <Callout type="info">
              Search is currently not available in development mode by default.
              <br />
              To still use search in development, run <code>
                zudoku build
              </code>{" "}
              and copy the <code>dist/pagefind</code> directory to your{" "}
              <code>public</code> directory.
            </Callout>
          ) : (
            "An error occurred while loading search."
          )}
        </div>
      ) : (
        <ResultList searchResults={searchResults ?? []} onClose={onClose} />
      )}
    </CommandDialog>
  );
};
