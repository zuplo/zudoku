import { cn } from "../../util/cn.js";

export const TextColorMap = {
  green: "text-green-600",
  blue: "text-sky-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
  purple: "text-purple-600",
  indigo: "text-indigo-600",
  gray: "text-gray-600",
};

export const ColorMap = {
  green: "bg-green-400 dark:bg-green-800",
  blue: "bg-sky-400 dark:bg-sky-800",
  yellow: "bg-yellow-400 dark:bg-yellow-800",
  red: "bg-red-400 dark:bg-red-800",
  purple: "bg-purple-400 dark:bg-purple-600",
  indigo: "bg-indigo-400 dark:bg-indigo-600",
  gray: "bg-gray-400 dark:bg-gray-600",
};

export const SidebarBadge = ({
  color,
  label,
  className,
}: {
  color: keyof typeof ColorMap;
  label: string;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "mt-0.5 flex items-center duration-200 transition-opacity text-center uppercase font-mono text-[0.65rem] font-bold rounded text-background dark:text-zinc-50 h-4 px-1",
        ColorMap[color],
        className,
      )}
    >
      {label}
    </span>
  );
};
