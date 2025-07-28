import { ChevronDownIcon, CircleFadingPlusIcon } from "lucide-react";
import { cn } from "../../../../util/cn.js";

export const AllOfGroupConnector = ({
  isOpen,
  className,
  schemeName,
}: {
  isOpen: boolean;
  className?: string;
  schemeName?: string;
}) => {
  return (
    <div
      className={cn(
        "text-green-500 dark:text-green-300/60",
        "relative text-sm flex py-2",
        "before:border-l before:absolute before:-top-2 before:-bottom-2 before:border-border before:border-dashed before:content-['']",
        className,
      )}
    >
      <div className="-translate-x-[7px] flex gap-1 items-center">
        <CircleFadingPlusIcon size={16} className="fill-card" />
        <div
          className={cn(
            "translate-y-px mx-px opacity-0 group-hover:opacity-100 transition",
            !isOpen && "-rotate-90",
          )}
        >
          <ChevronDownIcon size={16} />
        </div>
        <span className="text-sm text-foreground">{schemeName}</span>
      </div>
    </div>
  );
};
