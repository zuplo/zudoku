import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { cn } from "../../../util/cn.js";
import { SelectOnClick } from "./SelectOnClick.js";

export const EnumValues = ({
  values,
  className,
  maxVisibleValues = 8,
}: {
  values: Array<string | number>;
  className?: string;
  maxVisibleValues?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!values.length) return null;

  const shouldCollapse = values.length > maxVisibleValues;
  const visibleValues =
    shouldCollapse && !isOpen ? values.slice(0, maxVisibleValues) : values;

  return (
    <div className={cn("flex flex-wrap gap-1.5 text-xs", className)}>
      <span className="text-muted-foreground">Enum values: </span>
      {visibleValues.map((value) => (
        <div key={value}>
          <SelectOnClick className="border rounded px-1 font-mono">
            {value}
          </SelectOnClick>
        </div>
      ))}
      {shouldCollapse && (
        <Button
          variant="ghost"
          size="sm"
          className="h-fit px-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <div className="flex items-center gap-1">
              <ChevronUpIcon size={12} />
              <span className="text-muted-foreground">show less</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <ChevronDownIcon size={12} />
              <span className="text-muted-foreground">
                show {values.length - maxVisibleValues} more
              </span>
            </div>
          )}
        </Button>
      )}
    </div>
  );
};
