import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { CollapsibleTrigger } from "zudoku/ui/Collapsible.js";
import { cn } from "../../../util/cn.js";

export const CollapsibleHeaderTrigger = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-[max-content_1fr_max-content] items-center gap-2 group bg-muted w-full h-10 ps-4 pe-2 border-b",
        className,
      )}
    >
      {children}
      <CollapsibleTrigger
        className={cn(
          "flex items-center gap-4 group bg-muted w-full p-2 hover:bg-accent hover:brightness-95 opacity-75 rounded-md",
          className,
        )}
      >
        <ChevronsDownUpIcon
          className="group-data-[state=closed]:hidden shrink-0"
          size={14}
        />
        <ChevronsUpDownIcon
          className="group-data-[state=open]:hidden shrink-0"
          size={14}
        />
      </CollapsibleTrigger>
    </div>
  );
};

export const CollapsibleHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span className={cn("font-semibold w-full text-start", className)}>
      {children}
    </span>
  );
};
