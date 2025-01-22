import { useCommandState } from "cmdk";
import { useRef, useState } from "react";
import {
  Command,
  CommandInlineInput,
  CommandItem,
  CommandList,
} from "zudoku/ui/Command.js";
import { Popover, PopoverContent, PopoverTrigger } from "zudoku/ui/Popover.js";
import { cn } from "../util/cn.js";

type AutocompleteProps = {
  value: string;
  options: readonly string[];
  onChange: (e: string) => void;
  className?: string;
};

type AutocompletePopoverProps = AutocompleteProps & {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AutocompletePopover = ({
  value,
  options,
  onChange,
  className,
  open,
  setOpen,
}: AutocompletePopoverProps) => {
  const count = useCommandState((state) => state.filtered.count);
  const ref = useRef<HTMLInputElement>(null);

  return (
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
        className={cn("p-0 w-[--radix-popover-trigger-width]", {
          "border-0": count === 0,
        })}
        align="start"
        side="bottom"
      >
        <CommandList className="max-h-[140px]">
          {options.map((enumValue) => (
            <CommandItem
              key={enumValue}
              value={enumValue}
              onSelect={(selected) => {
                onChange(selected);
                setOpen(false);
              }}
              className="cursor-pointer"
            >
              {enumValue}
            </CommandItem>
          ))}
        </CommandList>
      </PopoverContent>
    </Popover>
  );
};

export const Autocomplete = ({
  value,
  options,
  onChange,
  className,
}: AutocompleteProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Command className="bg-transparent">
      <AutocompletePopover
        value={value}
        options={options}
        onChange={onChange}
        className={className}
        open={open}
        setOpen={setOpen}
      />
    </Command>
  );
};
