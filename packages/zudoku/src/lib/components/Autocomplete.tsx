import { PopoverAnchor } from "@radix-ui/react-popover";
import { useCommandState } from "cmdk";
import { useRef, useState, type KeyboardEvent, type Ref } from "react";
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
  placeholder?: string;
  onEnterPress?: (e: KeyboardEvent<HTMLInputElement>) => void;
  ref?: Ref<HTMLInputElement>;
  shouldFilter?: boolean;
};

const AutocompletePopover = ({
  value,
  options,
  onChange,
  className,
  placeholder = "Enter value",
  onEnterPress,
  ref,
}: AutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [dontClose, setDontClose] = useState(false);
  const count = useCommandState((state) => state.filtered.count);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Popover open={open}>
      <PopoverAnchor>
        <CommandInlineInput
          ref={(el) => {
            inputRef.current = el;
            if (typeof ref === "function") {
              ref(el);
            } else if (ref) {
              ref.current = el;
            }
          }}
          value={value}
          placeholder={placeholder}
          className={cn("h-9 bg-transparent", className)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (dontClose) {
              return;
            }
            setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setOpen(false);
              inputRef.current?.blur();
              onEnterPress?.(e);
            }
          }}
          onValueChange={(e) => onChange(e)}
        />
      </PopoverAnchor>
      <PopoverContent
        onMouseEnter={() => setDontClose(true)}
        onMouseLeave={() => setDontClose(false)}
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

export const Autocomplete = ({ shouldFilter, ...props }: AutocompleteProps) => {
  return (
    <Command className="bg-transparent" shouldFilter={shouldFilter}>
      <AutocompletePopover {...props} />
    </Command>
  );
};
