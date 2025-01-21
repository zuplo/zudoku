import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../ui/Command.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../ui/Popover.js";
import { cn } from "../../../util/cn.js";

interface EnumSelectorProps {
  value: string;
  enumValues: string[];
  onChange: (value: string) => void;
  onValueSelected: () => void;
}

export const EnumSelector = ({
  value,
  enumValues,
  onChange,
  onValueSelected,
}: EnumSelectorProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          className={cn(
            "px-3 py-2 w-full border-0 shadow-none text-xs font-mono text-start hover:bg-accent/40 rounded border-transparent hover:bg-accent",
            !value && "text-muted-foreground",
          )}
        >
          {value || "Select value"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width] "
        align="start"
        sideOffset={3}
        alignOffset={-3}
        side="bottom"
      >
        <Command className="max-h-[180px]">
          <CommandInput
            placeholder="Enter value"
            className="h-9 bg-transparent "
            onValueChange={setSearchValue}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onChange(searchValue);
                onValueSelected();
                setOpen(false);
              }
            }}
          />
          <CommandList>
            <CommandEmpty>Use "{searchValue}"</CommandEmpty>
            {enumValues.map((enumValue) => (
              <CommandItem
                key={enumValue}
                value={enumValue}
                onSelect={(selected) => {
                  onChange(selected);
                  onValueSelected();
                  setOpen(false);
                }}
              >
                {enumValue}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
