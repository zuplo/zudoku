import { SearchIcon } from "lucide-react";
import {
  createContext,
  type PropsWithChildren,
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isSearchPlugin } from "../core/plugins.js";
import { focusRing } from "../ui/util.js";
import { cn } from "../util/cn.js";
import { getOS } from "../util/os.js";
import { ClientOnly } from "./ClientOnly.js";
import { useZudoku } from "./context/ZudokuContext.js";

/** `null` when no search plugin is configured, `undefined` outside a provider */
const SearchContext = createContext<{ onOpen: () => void } | null | undefined>(
  undefined,
);

/**
 * Owns the search modal and the ⌘K / Ctrl+K shortcut for all `Search` buttons
 * below it. The header renders a button per breakpoint and placement, so
 * keeping this per button would open one modal for each of them.
 */
export const SearchProvider = ({ children }: PropsWithChildren) => {
  const ctx = useZudoku();
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);

  const searchPlugin = ctx.options.plugins?.find(isSearchPlugin);

  useEffect(() => {
    if (isOpen || !searchPlugin) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, searchPlugin]);

  const value = useMemo(
    () => (searchPlugin ? { onOpen } : null),
    [searchPlugin, onOpen],
  );

  return (
    <SearchContext value={value}>
      {children}
      {searchPlugin && (
        <Suspense>
          {searchPlugin.renderSearch({ isOpen, onOpen, onClose })}
        </Suspense>
      )}
    </SearchContext>
  );
};

export const Search = ({ className }: { className?: string }) => {
  const search = use(SearchContext);

  if (search === undefined) {
    throw new Error("Search must be used within a SearchProvider.");
  }

  if (!search) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={search.onOpen}
        className={cn(
          "relative w-full md:w-56 flex items-center border bg-clip-padding h-8 rounded-lg px-3 pr-14 text-sm transition-all",
          "border-input text-muted-foreground bg-background hover:bg-muted/50 hover:text-foreground shadow-xs",
          focusRing,
        )}
      >
        <div className="flex items-center gap-2">
          <SearchIcon size={14} />
          Search
        </div>
        <ClientOnly>
          <KbdShortcut />
        </ClientOnly>
      </button>
    </div>
  );
};

const KbdShortcut = () => {
  const os = getOS();
  return (
    <kbd className="hidden md:flex absolute inset-e-1.5 h-5 select-none items-center gap-0.5 rounded-sm border bg-muted px-1.5 font-mono text-xs font-medium">
      {os === "apple" ? <span className="text-base">⌘</span> : "CTRL+"}K
    </kbd>
  );
};
