import { cn } from "../../util/cn.js";

export const ColorMap = {
  green: "bg-badge-green",
  blue: "bg-badge-blue",
  yellow: "bg-badge-yellow",
  red: "bg-badge-red",
  purple: "bg-badge-purple",
  indigo: "bg-badge-indigo",
  gray: "bg-badge-gray",
  outline: "border border-border rounded-md text-foreground",
};

export const ColorMapInvert = {
  green: "text-badge-green-invert",
  blue: "text-badge-blue-invert",
  yellow: "text-badge-yellow-invert",
  red: "text-badge-red-invert",
  purple: "text-badge-purple-invert",
  indigo: "text-badge-indigo-invert",
  gray: "text-badge-gray-invert",
  outline: "",
};

export const NavigationBadge = ({
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
        "flex items-center duration-200 transition-opacity text-center uppercase text-[0.65rem] leading-5 font-bold rounded-sm h-full",
        color === "outline" ? "px-3" : "mt-0.5 px-1",
        invert
          ? ColorMapInvert[color]
          : cn("text-background dark:text-zinc-50", ColorMap[color]),
        className,
      )}
    >
      {label}
    </span>
  );
};
