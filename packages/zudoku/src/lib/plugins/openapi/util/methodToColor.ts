import {
  type BadgeColor,
  badgeColorStyle,
} from "../../../components/navigation/NavigationBadge.js";

/**
 * Single source of truth for HTTP method colors. The sidebar badge and the
 * method labels in the operation list and sidecar all resolve through this
 * map, so a method renders in the same color on every surface.
 */
const MethodColorMap: Record<string, BadgeColor> = {
  get: "green",
  post: "blue",
  put: "yellow",
  delete: "red",
  patch: "purple",
  options: "indigo",
  head: "gray",
  trace: "gray",
};

export const methodToColor = (method: string): BadgeColor =>
  MethodColorMap[method.toLowerCase()] ?? "gray";

/** Renders a method label in its palette color. */
export const methodColorProps = (method: string) => ({
  className: "text-badge-text",
  style: badgeColorStyle(methodToColor(method)),
});
