import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "zudoku/ui/Command.js";
import { Pagefind } from "./types.js";

const usePagefind = () => {
  const { data: pagefind, ...rest } = useQuery<Pagefind>({
    queryKey: ["pagefind"],
    queryFn: async () => {
      return await import(
        /* @vite-ignore */ `${location.origin}/pagefind/pagefind.js`
      ).then(async (x) => {
        await x.init();
        return x;
      });
    },
    enabled: typeof window !== "undefined",
  });

  return {
    ...rest,
    pagefind,
  };
};

export const PagefindSearch = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
  prefilledQuery?: string | null;
  settings: unknown;
}) => {
  const { pagefind } = usePagefind();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["pagefind-search", searchTerm],
    queryFn: async () => {
      const result = await pagefind?.search(searchTerm);
      const results = await Promise.all(
        result?.results.slice(0, 3).map((x) => x.data()) ?? [],
      );
      return results;
    },
    enabled: !!pagefind && !!searchTerm,
  });

  return (
    <CommandDialog
      command={{ shouldFilter: false }}
      open={isOpen}
      onOpenChange={onClose}
    >
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
            {result.sub_results.map((subResult) => (
              <CommandItem
                key={subResult.url + subResult.excerpt}
                className="flex flex-col items-start"
                onSelect={(e) => {
                  window.location.href = subResult.url.replace(".html", "");
                  onClose();
                }}
              >
                <span className="font-bold">{subResult.title}</span>

                <span
                  className="text-xs"
                  dangerouslySetInnerHTML={{ __html: subResult.excerpt }}
                ></span>
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
