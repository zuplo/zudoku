import { type BadgeColor, badgeColorClass } from "../../../util/badgeColor.js";
import { cn } from "../../../util/cn.js";

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

/** Classes that render a method label as text in its palette color. */
export const methodColorClass = (method: string) =>
  cn(badgeColorClass(methodToColor(method)), "text-badge");
