import { SearchIcon } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { isSearchPlugin } from "../core/plugins.js";
import { focusRing } from "../ui/util.js";
import { cn } from "../util/cn.js";
import { getOS } from "../util/os.js";
import { ClientOnly } from "./ClientOnly.js";
import { useZudoku } from "./context/ZudokuContext.js";

export const Search = ({ className }: { className?: string }) => {
  const ctx = useZudoku();
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = useCallback(() => setIsOpen(true), []);
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
  }, [isOpen]);

  const searchPlugin = ctx.options.plugins?.find(isSearchPlugin);

  if (!searchPlugin) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onOpen}
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
      <Suspense>{searchPlugin.renderSearch({ isOpen, onClose })}</Suspense>
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
