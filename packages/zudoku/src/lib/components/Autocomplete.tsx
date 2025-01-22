import { useRef, useState } from "react";
import {
  Command,
  CommandInlineInput,
  CommandItem,
  CommandList,
} from "zudoku/ui/Command.js";
import { Popover, PopoverContent, PopoverTrigger } from "zudoku/ui/Popover.js";
import { cn } from "../util/cn.js";

interface AutocompleteProps {
  value: string;
  options: readonly string[];
  onChange: (e: string) => void;
  className?: string;
}

export const Autocomplete = ({
  value,
  options,
  onChange,
  className,
}: AutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Command className="bg-transparent hover:bg-transparent">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <CommandInlineInput
            ref={ref}
            value={value}
            placeholder="Enter value"
            className={cn("h-9 bg-transparent", className)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setOpen(false);
                ref.current?.blur();
              }
            }}
            onValueChange={(e) => {
              onChange(e);
            }}
          />
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width] border-0"
          align="start"
          side="bottom"
        >
          <CommandList className="max-h-[140px] border rounded-md">
            {options.map((enumValue) => (
              <CommandItem
                key={enumValue}
                value={enumValue}
                onSelect={(selected) => {
                  onChange(selected);
                  setOpen(false);
                }}
              >
                {enumValue}
              </CommandItem>
            ))}
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  );
};
