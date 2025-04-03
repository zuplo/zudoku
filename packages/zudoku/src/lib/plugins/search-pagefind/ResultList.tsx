import { BracketsIcon, FileTextIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
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

export const ResultList = ({
  searchResults,
  searchTerm,
  onClose,
  maxSubResults = 4,
}: {
  basePath?: string;
  searchResults: PagefindSearchFragment[];
  searchTerm: string;
  onClose: () => void;
  maxSubResults?: number;
}) => {
  const navigate = useNavigate();
  const commandListRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    requestIdleCallback(() => {
      commandListRef.current?.scrollTo({ top: 0 });
    });
  }, [searchTerm]);

  return (
    <CommandList className="max-h-[450px]" ref={commandListRef}>
      {searchTerm && searchResults.length > 0 && (
        <CommandGroup
          className="text-sm text-muted-foreground"
          heading={`${searchResults.length} results for "${searchTerm}"`}
        />
      )}
      {searchTerm &&
        searchResults.map((result) => (
          <CommandGroup
            key={[result.meta.title ?? result.excerpt, result.url].join("-")}
          >
            <CommandItem
              asChild
              value={`${result.meta.title}-${result.url}`}
              className={hoverClassname}
              onSelect={() => {
                void navigate(result.url);
                onClose();
              }}
            >
              <Link to={result.url}>
                {result.meta.section === "openapi" ? (
                  <BracketsIcon />
                ) : (
                  <FileTextIcon />
                )}
                {result.meta.title}
              </Link>
            </CommandItem>
            {result.sub_results
              .sort(sortSubResults)
              .slice(0, maxSubResults)
              .map((subResult) => (
                <CommandItem
                  asChild
                  key={`sub-${result.meta.title}-${subResult.url}`}
                  value={`sub-${result.meta.title}-${subResult.url}`}
                  className={hoverClassname}
                  onSelect={() => {
                    void navigate(subResult.url);
                    onClose();
                  }}
                >
                  <Link to={subResult.url} onClick={onClose}>
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
