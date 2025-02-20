import { cn } from "../../util/cn.js";

export const ColorMap = {
  green: "bg-green-400 dark:bg-green-800",
  blue: "bg-sky-400 dark:bg-sky-800",
  yellow: "bg-yellow-400 dark:bg-yellow-800",
  red: "bg-red-400 dark:bg-red-800",
  purple: "bg-purple-400 dark:bg-purple-600",
  indigo: "bg-indigo-400 dark:bg-indigo-600",
  gray: "bg-gray-400 dark:bg-gray-600",
  outline: "border border-border rounded-md text-foreground",
};

export const ColorMapInvert = {
  green: "text-green-500 dark:text-green-600",
  blue: "text-sky-400 dark:text-sky-600",
  yellow: "text-yellow-400 dark:text-yellow-600",
  red: "text-red-400 dark:text-red-600",
  purple: "text-purple-400 dark:text-purple-600",
  indigo: "text-indigo-400 dark:text-indigo-600",
  gray: "text-gray-400 dark:text-gray-600",
  outline: "",
};

export const SidebarBadge = ({
  color,
  label,
  className,
  invert,
}: {
  color: keyof typeof ColorMap;
  label: string;
  className?: string;
  invert?: boolean;
}) => {
  return (
    <span
      className={cn(
        "flex items-center duration-200 transition-opacity text-center uppercase text-[0.65rem] font-bold rounded text-background dark:text-zinc-50 h-full",
        color === "outline" ? "px-3" : "mt-0.5 px-1",
        invert ? ColorMapInvert[color] : ColorMap[color],
        className,
      )}
    >
      {label}
    </span>
  );
};
