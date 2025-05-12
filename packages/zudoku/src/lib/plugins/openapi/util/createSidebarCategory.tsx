import type { SidebarItem } from "../../../../config/validators/SidebarSchema.js";
import type { OperationResult } from "../index.js";
import { MethodColorMap } from "./methodColorMap.js";

export const createSidebarCategory = ({
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
}): SidebarItem => ({
  type: "category",
  label,
  link: {
    type: "doc" as const,
    id: path,
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
