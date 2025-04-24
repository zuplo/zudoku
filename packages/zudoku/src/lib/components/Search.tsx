import { SearchIcon } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { isSearchPlugin } from "../core/plugins.js";
import { detectOS } from "../util/detectOS.js";
import { ClientOnly } from "./ClientOnly.js";
import { useZudoku } from "./context/ZudokuContext.js";

export const Search = ({ className }: { className?: string }) => {
  const ctx = useZudoku();
  const [isOpen, setIsOpen] = useState(false);

  const onClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, setIsOpen]);

  const searchPlugin = ctx.plugins.find(isSearchPlugin);

  if (!searchPlugin) {
    return null;
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center border border-input hover:bg-accent hover:text-accent-foreground p-4 relative h-8 justify-start rounded-lg bg-background text-sm text-muted-foreground shadow-none w-full sm:w-72"
      >
        <div className="flex items-center gap-2 flex-grow">
          <SearchIcon size={14} />
          Search
        </div>
        <ClientOnly>
          <KbdShortcut />
        </ClientOnly>
      </button>
      <Suspense fallback={null}>
        {searchPlugin.renderSearch({
          isOpen,
          onClose,
        })}
      </Suspense>
    </div>
  );
};

const KbdShortcut = () => {
  const os = detectOS();
  return (
    <kbd className="absolute right-1.5 hidden h-5 select-none items-center gap-1 rounded-sm border bg-muted px-1.5 font-mono text-[11px] font-medium opacity-100 sm:flex">
      {os === "macOS" ? "⌘" : "Ctrl"}+K
    </kbd>
  );
};
