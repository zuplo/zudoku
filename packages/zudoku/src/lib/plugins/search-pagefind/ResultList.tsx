import { FileTextIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { CommandGroup, CommandItem, CommandList } from "zudoku/ui/Command.js";
import { type PagefindSearchFragment, type PagefindSubResult } from "./types.js";

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

const hoverClassname = `cursor-pointer border border-transparent data-[selected=true]:border-border`;

export const ResultList = ({
  searchResults,
  onClose,
}: {
  searchResults: PagefindSearchFragment[];
  onClose: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <CommandList className="max-h-[450px]">
      {searchResults.map((result) => (
        <CommandGroup
          key={[result.meta.title ?? result.excerpt, result.url].join("-")}
        >
          <CommandItem
            asChild
            value={`${result.meta.title}-${result.url}`}
            className={hoverClassname}
          >
            <Link to={result.url}>
              <FileTextIcon size={20} className="text-muted-foreground" />
              {result.meta.title}
            </Link>
          </CommandItem>
          {result.sub_results
            .sort(sortSubResults)
            .slice(0, 4)
            .map((subResult) => {
              const url = subResult.url.replace(".html", "");
              const navigateTo = url.startsWith(import.meta.env.BASE_URL)
                ? url.slice(import.meta.env.BASE_URL.length)
                : url;

              return (
                <CommandItem
                  asChild
                  key={`${result.meta.title}-${subResult.url}-${subResult.excerpt}`}
                  className={hoverClassname}
                  onSelect={() => {
                    void navigate(navigateTo);
                    onClose();
                  }}
                >
                  <Link to={navigateTo} onClick={onClose}>
                    <div className="flex flex-col items-start gap-2 ms-2.5 ps-5 border-l border-muted-foreground/50">
                      <span className="font-bold">{subResult.title}</span>
                      <span
                        className="text-[13px] [&_mark]:bg-primary [&_mark]:text-primary-foreground"
                        dangerouslySetInnerHTML={{ __html: subResult.excerpt }}
                      />
                    </div>
                  </Link>
                </CommandItem>
              );
            })}
        </CommandGroup>
      ))}
    </CommandList>
  );
};
