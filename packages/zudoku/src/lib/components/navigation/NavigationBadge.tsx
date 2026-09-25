import type { CSSProperties } from "react";
import { cn } from "../../util/cn.js";

/**
 * Semantic badge palette. Each name resolves to a single `--badge-*` token;
 * the filled and text treatments are derived from that token in `main.css`,
 * so a site re-colors every badge surface by overriding one variable.
 */
export const BadgeColors = [
  "green",
  "blue",
  "yellow",
  "red",
  "purple",
  "indigo",
  "gray",
] as const;

export type BadgeColor = (typeof BadgeColors)[number];
export type NavigationBadgeColor = BadgeColor | "outline";

/** Points the badge treatments at one palette token. */
export const badgeColorStyle = (color: BadgeColor) =>
  ({ "--badge-color": `var(--badge-${color})` }) as CSSProperties;

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
}) => {
  // `outline` isn't a palette color, so it renders from theme tokens directly
  // and ignores `invert` — there's no fill to invert.
  const isOutline = color === "outline";

  return (
    <span
      style={isOutline ? undefined : badgeColorStyle(color)}
      className={cn(
        "flex items-center duration-200 transition-opacity text-center uppercase text-[0.65rem] leading-5 font-bold rounded-sm h-full",
        isOutline
          ? "px-3 rounded-md border border-border text-foreground"
          : cn(
              "mt-0.5 px-1",
              invert
                ? "text-badge-text"
                : "bg-badge-fill text-badge-fill-foreground",
            ),
        className,
      )}
    >
      {label}
    </span>
  );
};
