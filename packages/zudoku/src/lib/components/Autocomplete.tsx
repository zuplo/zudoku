import { PopoverAnchor } from "@radix-ui/react-popover";
import { useCommandState } from "cmdk";
import { useRef, useState } from "react";
import {
  Command,
  CommandInlineInput,
  CommandItem,
  CommandList,
} from "zudoku/ui/Command.js";
import { Popover, PopoverContent } from "zudoku/ui/Popover.js";
import { cn } from "../util/cn.js";

type AutocompleteProps = {
  value: string;
  options: readonly string[];
  onChange: (e: string) => void;
  className?: string;
};

const AutocompletePopover = ({
  value,
  options,
  onChange,
  className,
}: AutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const count = useCommandState((state) => state.filtered.count);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Popover open={open}>
      <PopoverAnchor>
        <CommandInlineInput
          key="input"
          ref={ref}
          value={value}
          placeholder="Enter value"
          className={cn("h-9 bg-transparent", className)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => {
              setOpen(false);
            }, 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setOpen(false);
              ref.current?.blur();
            }
          }}
          onValueChange={(e) => onChange(e)}
        />
      </PopoverAnchor>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn("p-0 w-[--radix-popover-trigger-width]", {
          "border-0": count === 0,
        })}
        align="start"
        side="bottom"
        onWheel={(e) => {
          // See: https://github.com/radix-ui/primitives/issues/1159
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
        }}
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
  return (
    <Command className="bg-transparent">
      <AutocompletePopover
        value={value}
        options={options}
        onChange={onChange}
        className={className}
      />
    </Command>
  );
};
