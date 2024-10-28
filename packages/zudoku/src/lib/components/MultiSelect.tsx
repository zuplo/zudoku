import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "../util/cn.js";

import {
  SelectContent,
  SelectGroup,
  SelectScrollDownButton,
  SelectScrollUpButton,
} from "./Select.js";

type MultiSelectProps = {
  options: string[];
  value?: string; // this value will only be used to clear the selected items
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

const MultiSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    selectedItems: string[];
    placeholder?: string;
  }
>(
  (
    { className, selectedItems, placeholder = "Select options", ...props },
    ref,
  ) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span
        className={`truncate ${selectedItems.length === 0 ? "text-muted-foreground" : ""}`}
      >
        {selectedItems.length > 0 ? selectedItems.join(", ") : placeholder}
      </span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="flex-shrink-0 h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
);
MultiSelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const MultiSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    value: string;
    selectedItems: string[];
  }
>(({ className, children, value, selectedItems, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    value={value}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 my-1",
      className,
      `${selectedItems.includes(value) && "bg-accent text-accent-foreground"}`,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {selectedItems.includes(value) && <Check className="h-4 w-4" />}
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
MultiSelectItem.displayName = SelectPrimitive.Item.displayName;

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder,
  className,
}) => {
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (value === "") setSelectedItems([]);
  }, [value]);

  const handleValueChange = (newValue: string) => {
    if (newValue === "") return; // Prevent adding empty string

    const updatedValues = selectedItems.includes(newValue)
      ? selectedItems.filter((item) => item !== newValue) // Remove if selected
      : [...selectedItems, newValue]; // Add if not selected

    setSelectedItems(updatedValues);
    if (onValueChange) {
      onValueChange(updatedValues);
    }
  };

  return (
    <SelectPrimitive.Root value={value} onValueChange={handleValueChange}>
      <MultiSelectTrigger
        selectedItems={selectedItems}
        placeholder={placeholder}
      />
      <SelectContent>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="p-1">
          <SelectGroup>
            {options.map((option) => (
              <MultiSelectItem
                key={option}
                value={option}
                selectedItems={selectedItems}
              >
                {option}
              </MultiSelectItem>
            ))}
          </SelectGroup>
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectContent>
    </SelectPrimitive.Root>
  );
};

export default MultiSelect;
