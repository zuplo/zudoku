import { CircleDotIcon, CircleIcon, PlusCircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../../util/cn.js";
import type { LogicalGroupType } from "../SchemaComponents.js";

const iconMap = {
  AND: <PlusCircleIcon size={16} className="-translate-x-1/2 fill-card" />,
  OR: <CircleDotIcon size={16} className="-translate-x-1/2 fill-card" />,
  ONE: <CircleIcon size={14} className="-translate-x-1/2 fill-card" />,
} as const;

const colorClass = {
  AND: "text-green-500 dark:text-green-300/60",
  OR: "text-blue-400 dark:text-blue-500",
  ONE: "text-purple-500 dark:text-purple-300/60",
} as const;

const labelMap = {
  AND: "and",
  OR: "or",
  ONE: "one",
} as const;

export const LogicalGroupConnector = ({
  type,
  children,
}: {
  type: LogicalGroupType;
  children?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        colorClass[type],
        "relative text-sm flex items-center py-4",
        "before:border-l before:absolute before:left-0 before:-top-[8px] before:-bottom-[8px] before:border-border before:border-dashed before:content-['']",
      )}
    >
      {iconMap[type]}
      {children ?? labelMap[type]}
    </div>
  );
};
