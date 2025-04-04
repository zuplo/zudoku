import {
  ChevronDownIcon,
  CircleDotIcon,
  CircleFadingPlusIcon,
  CircleIcon,
} from "lucide-react";
import { cn } from "../../../../util/cn.js";

import type { LogicalGroupType } from "../utils.js";

const iconMap = {
  AND: <CircleFadingPlusIcon size={16} className="fill-card" />,
  OR: <CircleDotIcon size={16} className="fill-card" />,
  ONE: <CircleIcon size={14} className="fill-card" />,
} as const;

const colorClass = {
  AND: "text-green-500 dark:text-green-300/60",
  OR: "text-blue-400 dark:text-blue-500",
  ONE: "text-purple-500 dark:text-purple-300/60",
} as const;

export const LogicalGroupConnector = ({
  type,
  isOpen,
  className,
  schemeName,
}: {
  type: LogicalGroupType;
  isOpen: boolean;
  className?: string;
  schemeName?: string;
}) => {
  return (
    <div
      className={cn(
        colorClass[type],
        "relative text-sm flex py-2",
        "before:border-l before:absolute before:-top-2 before:-bottom-2 before:border-border before:border-dashed before:content-['']",
        className,
      )}
    >
      <div className="-translate-x-[7px] flex gap-1 items-center">
        {iconMap[type]}
        <div
          className={cn(
            "translate-y-px mx-px opacity-0 group-hover:opacity-100 transition",
            !isOpen && "-rotate-90",
          )}
        >
          <ChevronDownIcon size={16} />
        </div>
        <span className="text-sm text-foreground">{schemeName}</span>
      </div>
    </div>
  );
};
