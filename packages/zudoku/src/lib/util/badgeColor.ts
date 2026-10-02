/**
 * Semantic badge palette, shared by navigation badges and OpenAPI method
 * labels. Each name maps to a `--badge-*` theme token defined per theme in
 * `defaultTheme.css`.
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

// Literal class names so Tailwind can see them when scanning sources.
const BadgeColorClass: Record<BadgeColor, string> = {
  green: "[--badge-color:var(--badge-green)]",
  blue: "[--badge-color:var(--badge-blue)]",
  yellow: "[--badge-color:var(--badge-yellow)]",
  red: "[--badge-color:var(--badge-red)]",
  purple: "[--badge-color:var(--badge-purple)]",
  indigo: "[--badge-color:var(--badge-indigo)]",
  gray: "[--badge-color:var(--badge-gray)]",
};

/**
 * Points the `text-badge` / `bg-badge` utilities at one palette token. Pair it
 * with one of them: on its own it only sets the variable.
 */
export const badgeColorClass = (color: BadgeColor) => BadgeColorClass[color];
