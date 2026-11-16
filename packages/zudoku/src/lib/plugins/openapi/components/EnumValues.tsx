import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { cn } from "../../../util/cn.js";
import { SelectOnClick } from "./SelectOnClick.js";

export const EnumValues = ({
  values,
  className,
  descriptions,
  maxVisibleValues = 8,
}: {
  values: Array<string | number>;
  descriptions?: Record<string, string>;
  className?: string;
  maxVisibleValues?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!values.length) return null;

  const shouldCollapse = values.length > maxVisibleValues;
  const visibleValues =
    shouldCollapse && !isOpen ? values.slice(0, maxVisibleValues) : values;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <span className="text-muted-foreground">Enum values:</span>
      {descriptions ? (
        <dl className="basis-full grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
          {visibleValues.map((value) => (
            <Fragment key={value}>
              <dt>
                <SelectOnClick className="border rounded-sm px-1 font-mono">
                  {value}
                </SelectOnClick>
              </dt>
              <dd className="text-muted-foreground">
                {descriptions[String(value)]}
              </dd>
            </Fragment>
          ))}
        </dl>
      ) : (
        visibleValues.map((value) => (
          <div key={value}>
            <SelectOnClick className="border rounded-sm px-1 font-mono">
              {value}
            </SelectOnClick>
          </div>
        ))
      )}
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
