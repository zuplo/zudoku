import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { Callout } from "zudoku/ui/Callout.js";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
} from "zudoku/ui/Command.js";
import { DialogTitle } from "zudoku/ui/Dialog.js";
import { useAuthState } from "../../authentication/state.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";
import { SEARCH_PROTECTED_SECTION } from "../../core/RouteGuard.js";
import { joinUrl } from "../../util/joinUrl.js";
import { getResults } from "./get-results.js";
import type { PagefindOptions } from "./index.js";
import { ResultList } from "./ResultList.js";
import type { Pagefind } from "./types.js";

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

const importPagefind = (basePath?: string): Promise<Pagefind> =>
  import.meta.env.DEV
    ? // @ts-expect-error TypeScript can't resolve the import
      import(/* @vite-ignore */ "/pagefind/pagefind.js")
    : import(/* @vite-ignore */ joinUrl(basePath, "/pagefind/pagefind.js"));

const usePagefind = (options: PagefindOptions) => {
  const {
    options: { basePath },
  } = useZudoku();
  const { data: pagefind, ...result } = useQuery<Pagefind>({
    queryKey: ["pagefind", options.ranking],
    retry: false,
    queryFn: async () => {
      const pagefind = await importPagefind(basePath);
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

  if (result.isError && result.error.message !== "NOT_BUILT_YET") {
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
  const auth = useAuthState();
  const context = useZudoku();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults } = useQuery({
    queryKey: ["pagefind-search", searchTerm, auth.isAuthenticated],
    queryFn: async () => {
      const filters = auth.isAuthenticated
        ? undefined
        : { not: { section: SEARCH_PROTECTED_SECTION } };

      const search = await pagefind?.search(searchTerm, { filters });
      if (!search) return [];
      return getResults({ search, options, auth, context });
    },
    placeholderData: keepPreviousData,
    enabled: !!pagefind && !!searchTerm,
  });

  return (
    <CommandDialog
      command={{ shouldFilter: false }}
      content={{ className: "max-w-[750px]" }}
      open={isOpen}
      onOpenChange={onClose}
    >
      <VisuallyHidden>
        <DialogTitle>Search</DialogTitle>
      </VisuallyHidden>
      <CommandInput
        ref={inputRef}
        placeholder="Search..."
        value={searchTerm}
        onValueChange={setSearchTerm}
        disabled={isError}
      />
      <CommandEmpty>
        {searchTerm ? (
          <div className="flex flex-col items-center">
            No results found.
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm("");
                inputRef.current?.focus();
              }}
            >
              Clear search
            </Button>
          </div>
        ) : (
          "Start typing to search"
        )}
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
        <ResultList
          searchResults={searchResults ?? []}
          searchTerm={searchTerm}
          onClose={onClose}
          maxSubResults={options.maxSubResults}
        />
      )}
    </CommandDialog>
  );
};
