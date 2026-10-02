import { type BadgeColor, badgeColorClass } from "../../util/badgeColor.js";
import { cn } from "../../util/cn.js";

export type NavigationBadgeColor = BadgeColor | "outline";

export const NavigationBadge = ({
  color,
  label,
  className,
  invert,
}: {
  color: NavigationBadgeColor;
  label: string;
  className?: string;
  invert?: boolean;
}) => (
  <span
    className={cn(
      "flex items-center duration-200 transition-opacity text-center uppercase text-[0.65rem] leading-5 font-bold rounded-sm h-full",
      // `outline` isn't a palette color, so it renders from theme tokens
      // directly and ignores `invert`: there's no fill to invert.
      color === "outline"
        ? "px-3 rounded-md border border-border text-foreground"
        : cn(
            "mt-0.5 px-1",
            badgeColorClass(color),
            invert ? "text-badge" : "bg-badge text-background",
          ),
      className,
    )}
  >
    {label}
  </span>
);
