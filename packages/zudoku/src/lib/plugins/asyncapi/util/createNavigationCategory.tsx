import type { NavigationItem } from "../../../../config/validators/NavigationSchema.js";
import type { NavOperationResult } from "../graphql/queries.js";
import {
  type BadgeColor,
  getProtocolLabel,
  ProtocolColorMap,
} from "./actionColorMap.js";

/**
 * Groups operations by channel address
 */
const groupByChannel = (
  operations: NavOperationResult[],
): Map<string, NavOperationResult[]> => {
  const groups = new Map<string, NavOperationResult[]>();

  for (const op of operations) {
    const address = op.channelAddress ?? "unknown";
    const existing = groups.get(address) ?? [];
    groups.set(address, [...existing, op]);
  }

  return groups;
};

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
}): NavigationItem => {
  // Group operations by channel address
  const channelGroups = groupByChannel(operations);

  return {
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
    items: Array.from(channelGroups.entries()).map(
      ([channelAddress, channelOps]) => {
        // Use the first operation for common data (protocol, slug)
        const primaryOp = channelOps[0];
        const primaryProtocol = primaryOp?.protocols[0];
        const badgeLabel = primaryProtocol
          ? getProtocolLabel(primaryProtocol)
          : "API";
        const badgeColor = primaryProtocol
          ? (ProtocolColorMap[primaryProtocol.toLowerCase()] ?? "gray")
          : "gray";

        // Use slug from the first operation (send or receive)
        const anchor = primaryOp?.slug ?? primaryOp?.operationId ?? "";

        return {
          type: "link" as const,
          label: channelAddress,
          to: `${path}#${anchor}`,
          badge: {
            label: badgeLabel,
            color: badgeColor as BadgeColor,
            invert: true,
          },
        };
      },
    ),
  };
};
