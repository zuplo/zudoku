import type { NavigationItem } from "../../../../config/validators/NavigationSchema.js";
import type { OperationResult } from "../graphql/queries.js";
import { ActionColorMap } from "./actionColorMap.js";

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
    path,
    file: path,
    label,
  },
  collapsible,
  collapsed,
  items: operations.map((operation) => ({
    type: "link" as const,
    label:
      operation.summary ?? operation.channelAddress ?? operation.operationId,
    to: `${path}#${operation.slug}`,
    badge: {
      label: operation.action.toUpperCase(),
      color: ActionColorMap[operation.action.toLowerCase()] ?? "gray",
      invert: true,
    },
  })),
});
