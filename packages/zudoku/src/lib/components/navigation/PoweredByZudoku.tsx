import { ChevronRightIcon } from "lucide-react";
import { cn } from "../../util/cn.js";
import ZudokuLogo from "./ZudokuLogo.js";
import ZuploLogo from "./ZuploLogo.js";

export const PoweredByZudoku = ({ className }: { className?: string }) => (
  <a
    href={import.meta.env.IS_ZUPLO ? "https://zuplo.com" : "https://zudoku.dev"}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "flex justify-between items-center w-full border border-transparent hover:border-border rounded-full hover:shadow-sm h-7 px-3 text-nowrap hover:bg-muted/80 transition-all",
      className,
    )}
  >
    <div className="opacity-70 hover:opacity-100 transition-opacity gap-1.5 text-[11px] font-medium rounded-full h-7 flex items-center text-nowrap">
      {import.meta.env.IS_ZUPLO ? (
        <ZuploLogo className="w-3.5 h-3.5 dark:fill-white" />
      ) : (
        <ZudokuLogo className="w-3.5 h-3.5 dark:fill-white" />
      )}
      powered by {import.meta.env.IS_ZUPLO ? "Zuplo" : "Zudoku"}
    </div>
    <div className="text-xs font-medium opacity-70 hover:text-foreground transition-colors cursor-pointer">
      <ChevronRightIcon size={12} absoluteStrokeWidth strokeWidth={1.5} />
    </div>
  </a>
);
