import { FileTextIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { CommandGroup, CommandItem, CommandList } from "zudoku/ui/Command.js";
import {
  type PagefindSearchFragment,
  type PagefindSubResult,
} from "./types.js";

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

const cleanResultUrl = (url: string) => {
  const clean = url.replace(".html", "");
  return clean.startsWith(import.meta.env.BASE_URL)
    ? clean.slice(import.meta.env.BASE_URL.length)
    : clean;
};

export const ResultList = ({
  searchResults,
  searchTerm,
  onClose,
  maxSubResults = 4,
}: {
  searchResults: PagefindSearchFragment[];
  searchTerm: string;
  onClose: () => void;
  maxSubResults?: number;
}) => {
  const navigate = useNavigate();

  return (
    <CommandList className="max-h-[450px]">
      {searchTerm && searchResults.length > 0 && (
        <CommandGroup
          className="text-sm text-muted-foreground"
          heading={`${searchResults.length} results for "${searchTerm}"`}
        />
      )}
      {searchResults.map((result) => (
        <CommandGroup
          key={[result.meta.title ?? result.excerpt, result.url].join("-")}
        >
          <CommandItem
            asChild
            value={`${result.meta.title}-${result.url}`}
            className={hoverClassname}
            onSelect={() => {
              void navigate(cleanResultUrl(result.url));
              onClose();
            }}
          >
            <Link to={cleanResultUrl(result.url)}>
              <FileTextIcon size={20} className="text-muted-foreground" />
              {result.meta.title}
            </Link>
          </CommandItem>
          {result.sub_results
            .sort(sortSubResults)
            .slice(0, maxSubResults)
            .map((subResult) => (
              <CommandItem
                asChild
                key={`${result.meta.title}-${subResult.url}`}
                value={`${result.meta.title}-${subResult.url}`}
                className={hoverClassname}
                onSelect={() => {
                  void navigate(cleanResultUrl(subResult.url));
                  onClose();
                }}
              >
                <Link to={cleanResultUrl(subResult.url)} onClick={onClose}>
                  <div className="flex flex-col items-start gap-2 ms-2.5 ps-5 border-l border-muted-foreground/50">
                    <span className="font-bold">{subResult.title}</span>
                    <span
                      className="text-[13px] [&_mark]:bg-primary [&_mark]:text-primary-foreground"
                      dangerouslySetInnerHTML={{ __html: subResult.excerpt }}
                    />
                  </div>
                </Link>
              </CommandItem>
            ))}
        </CommandGroup>
      ))}
    </CommandList>
  );
};
