import { useState } from "react";
import { Button } from "../../../ui/Button.js";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
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
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between border-0 shadow-none text-xs font-mono",
            !value && "text-muted-foreground",
          )}
        >
          {value || "Select value..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search values..."
            className="h-9"
            onValueChange={setSearchValue}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onChange(searchValue);
                onValueSelected();
                setOpen(false);
              }
            }}
          />
          <CommandEmpty>Use "{searchValue}"</CommandEmpty>
          <CommandGroup>
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
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
