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
    <CollapsibleTrigger
      className={cn(
        "flex items-center gap-4 group bg-muted w-full h-10 px-4 border-b",
        className,
      )}
    >
      {children}
      <ChevronUpIcon
        className="group-data-[state=open]:rotate-180 flex-shrink-0"
        size={16}
      />
    </CollapsibleTrigger>
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
