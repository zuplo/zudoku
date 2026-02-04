import type { NavigationItem } from "../../../../config/validators/NavigationSchema.js";
import type { NavOperationResult } from "../graphql/queries.js";
import {
  type BadgeColor,
  getProtocolLabel,
  ProtocolColorMap,
} from "./actionColorMap.js";

export const createNavigationCategory = ({
  label,
  path,
  operations,
  collapsible,
  collapsed,
}: {
  label: string;
  path: string;
  operations: NavOperationResult[];
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
  items: operations.map((operation) => {
    // Use the primary protocol for the badge (first detected protocol)
    const primaryProtocol = operation.protocols[0];
    const badgeLabel = primaryProtocol
      ? getProtocolLabel(primaryProtocol)
      : operation.action.toUpperCase();
    const badgeColor = primaryProtocol
      ? (ProtocolColorMap[primaryProtocol.toLowerCase()] ?? "gray")
      : "gray";

    // Use slug if available, otherwise fall back to operationId
    const anchor = operation.slug ?? operation.operationId;

    return {
      type: "link" as const,
      label:
        operation.summary ?? operation.channelAddress ?? operation.operationId,
      to: `${path}#${anchor}`,
      badge: {
        label: badgeLabel,
        color: badgeColor as BadgeColor,
        invert: true,
      },
    };
  }),
});
