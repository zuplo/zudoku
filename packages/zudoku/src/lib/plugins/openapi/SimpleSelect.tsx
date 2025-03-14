import { ChevronsUpDownIcon } from "lucide-react";
import type { ChangeEventHandler } from "react";
import { cn } from "../../util/cn.js";

export const SimpleSelect = ({
  value,
  onChange,
  className,
  options,
  showChevrons = true,
}: {
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  className?: string;
  options: {
    value: string;
    label: string;
  }[];
  showChevrons?: boolean;
}) => (
  <div className="grid">
    <select
      className={cn(
        "w-full row-start-1 col-start-1 border border-input text-foreground px-2 py-1 pe-6",
        "rounded-md appearance-none bg-zinc-50 hover:bg-white dark:bg-zinc-800 hover:dark:bg-zinc-800/75",
        className,
      )}
      value={value}
      onChange={onChange}
    >
      {options.map((option) => (
        <option value={option.value} key={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <div
      className={cn(
        !showChevrons && "hidden",
        "row-start-1 col-start-1 self-center justify-self-end relative end-2 pointer-events-none",
      )}
    >
      <ChevronsUpDownIcon size={14} />
    </div>
  </div>
);
