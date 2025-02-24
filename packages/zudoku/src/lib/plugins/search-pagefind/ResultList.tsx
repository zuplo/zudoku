import { Link, useNavigate } from "react-router";
import { CommandGroup, CommandItem, CommandList } from "zudoku/ui/Command.js";
import { PagefindSearchFragment, PagefindSubResult } from "./types.js";

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

export const ResultList = ({
  searchResults,
  onClose,
}: {
  searchResults: PagefindSearchFragment[];
  onClose: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <CommandList>
      {searchResults.map((result, i) => {
        const groupKey = [result.meta.title, result.meta.url, result.excerpt]
          .filter(Boolean)
          .join("-");
        return (
          <CommandGroup heading={result.meta.title ?? "" + i} key={groupKey}>
            {result.sub_results
              .sort(sortSubResults)
              .slice(0, 3)
              .map((subResult) => {
                const url = subResult.url.replace(".html", "");
                const navigateTo = url.startsWith(import.meta.env.BASE_URL)
                  ? url.slice(import.meta.env.BASE_URL.length)
                  : url;

                return (
                  <CommandItem
                    key={`${result.meta.title}-${subResult.url}-${subResult.excerpt}`}
                    className="flex flex-col items-start"
                    onSelect={() => {
                      void navigate(navigateTo);
                      onClose();
                    }}
                  >
                    <span className="font-bold">{subResult.title}</span>
                    <span
                      className="text-xs"
                      dangerouslySetInnerHTML={{ __html: subResult.excerpt }}
                    />
                    <Link
                      className="text-xs text-muted-foreground"
                      to={navigateTo}
                    >
                      {navigateTo}
                    </Link>
                  </CommandItem>
                );
              })}
          </CommandGroup>
        );
      })}
    </CommandList>
  );
};
