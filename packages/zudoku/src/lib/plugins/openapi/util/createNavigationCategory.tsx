import type { NavigationItem } from "../../../../config/validators/NavigationSchema.js";
import type { OperationResult } from "../index.js";
import { MethodColorMap } from "./methodColorMap.js";

export const createNavigationCategory = ({
  label,
  path,
  operations,
  collapsible,
  collapsed,
}: {
  label: string;
  path: string;
  operations: OperationResult[];
  collapsible?: boolean;
  collapsed?: boolean;
}): NavigationItem => ({
  type: "category",
  label,
  link: {
    type: "doc" as const,
    file: path,
    label,
  },
  collapsible,
  collapsed,
  items: operations.map((operation) => ({
    type: "link" as const,
    label: operation.summary ?? operation.path,
    href: `${path}#${operation.slug}`,
    badge: {
      label: operation.method,
      color: MethodColorMap[operation.method.toLowerCase()]!,
      invert: true,
    },
  })),
});
