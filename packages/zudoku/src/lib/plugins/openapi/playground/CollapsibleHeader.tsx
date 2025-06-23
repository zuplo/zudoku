import { ChevronUpIcon } from "lucide-react";
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
        "grid grid-cols-[max-content_1fr_min-content_max-content] items-center gap-4 group bg-muted w-full h-10 ps-4 pe-2 border-b",
        className,
      )}
    >
      {children}
      <CollapsibleTrigger
        className={cn(
          "flex items-center gap-4 group bg-muted w-full p-2 hover:bg-accent hover:brightness-95 rounded-md",
          className,
        )}
      >
        <ChevronUpIcon
          className="group-data-[state=open]:rotate-180 transition-transform flex-shrink-0"
          size={16}
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
