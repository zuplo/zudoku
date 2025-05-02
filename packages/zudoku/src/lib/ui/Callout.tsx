import {
  AlertTriangleIcon,
  InfoIcon,
  LightbulbIcon,
  type LucideIcon,
  ShieldAlertIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../util/cn.js";

const stylesMap = {
  note: {
    border: "border-gray-300 dark:border-zinc-800",
    bg: "bg-gray-100 dark:bg-zinc-800/50",
    iconColor: "text-gray-600 dark:text-zinc-300",
    titleColor: "text-gray-600 dark:text-zinc-300",
    textColor: "text-gray-600 dark:text-zinc-300",
    Icon: InfoIcon as LucideIcon,
  },
  tip: {
    border: "border-green-500 dark:border-green-800",
    bg: "bg-green-200/25 dark:bg-green-950/70",
    iconColor: "text-green-600 dark:text-green-200",
    titleColor: "text-green-700 dark:text-green-200",
    textColor: "text-green-600 dark:text-green-50",
    Icon: LightbulbIcon as LucideIcon,
  },
  info: {
    border: "border-blue-400 dark:border-blue-900/60",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-400 dark:text-blue-200",
    titleColor: "text-blue-700 dark:text-blue-200",
    textColor: "text-blue-600 dark:text-blue-100",
    Icon: InfoIcon as LucideIcon,
  },
  caution: {
    border: "border-yellow-400 dark:border-yellow-400/25",
    bg: "bg-yellow-100/60 dark:bg-yellow-400/10",
    iconColor: "text-yellow-500 dark:text-yellow-300",
    titleColor: "text-yellow-600 dark:text-yellow-300",
    textColor: "text-yellow-700 dark:text-yellow-200",
    Icon: AlertTriangleIcon as LucideIcon,
  },
  danger: {
    border: "border-rose-400 dark:border-rose-800",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-400 dark:text-rose-300",
    titleColor: "text-rose-800 dark:text-rose-300",
    textColor: "text-rose-700 dark:text-rose-100",
    Icon: ShieldAlertIcon as LucideIcon,
  },
} as const;

type CalloutProps = {
  type: keyof typeof stylesMap;
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: boolean;
};

export const Callout = ({
  type,
  children,
  title,
  className,
  icon = true,
}: CalloutProps) => {
  const { border, bg, iconColor, titleColor, textColor, Icon } =
    stylesMap[type];

  return (
    <div
      className={cn(
        "not-prose rounded-md border p-4 text-md my-2",
        icon &&
          "grid grid-cols-[min-content_1fr] items-baseline grid-rows-[fit-content_1fr] gap-x-4 gap-y-2",
        !icon && title && "flex flex-col gap-2",
        "[&_a]:underline [&_a]:decoration-current [&_a]:decoration-from-font [&_a]:underline-offset-4 hover:[&_a]:decoration-1",
        "[&_code]:!bg-gray-50 [&_code]:dark:!bg-gray-800 [&_code]:!border-none",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-4 [&_ul>li]:ps-1 [&_ul>li]:my-1",
        icon && title && "items-center",
        border,
        bg,
        className,
      )}
    >
      {icon && (
        <Icon
          className={cn(!title ? "translate-y-1" : "align-middle", iconColor)}
          size={20}
          aria-hidden="true"
        />
      )}
      {title && <h3 className={cn("font-medium", titleColor)}>{title}</h3>}
      <div
        className={cn(
          icon && "col-start-2",
          !title && icon && "row-start-1",
          textColor,
        )}
      >
        {children}
      </div>
    </div>
  );
};
