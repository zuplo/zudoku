import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "zudoku/ui/Popover.js";
import { cn } from "../util/cn.js";

type MultiAutocompleteProps = {
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

export const MultiAutocomplete = ({
  options,
  value,
  onChange,
  placeholder = "Select values...",
  className,
}: MultiAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggleValue = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          className={cn(
            "flex items-center justify-between w-full h-9 bg-transparent text-xs font-mono text-left truncate",
            !value.length && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {value.length > 0 ? value.join(", ") : placeholder}
          </span>
          <ChevronDownIcon className="size-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-1 w-(--radix-popover-trigger-width)"
        align="start"
        side="bottom"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="max-h-[140px] overflow-y-auto">
          {options.map((option) => {
            const isSelected = value.includes(option);
            return (
              <button
                key={option}
                type="button"
                className="flex items-center gap-2 w-full rounded-xs px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => toggleValue(option)}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                    isSelected &&
                      "bg-primary border-primary text-primary-foreground",
                  )}
                >
                  {isSelected && <CheckIcon className="size-3" />}
                </span>
                <span className="truncate font-mono text-xs">{option}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
