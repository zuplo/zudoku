import type {
  AsyncAPIDocument,
  ChannelObject,
  OperationObject,
} from "../types.js";
import { detectProtocols } from "./protocol.js";

export type EnrichedOperation = OperationObject & {
  operationId: string;
  channelAddress?: string;
  channelId?: string;
  protocols: string[];
  parentTag?: string;
};

/**
 * Check if an object is a dereferenced channel (has address property)
 */
const isDereferencedChannel = (obj: unknown): obj is ChannelObject => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    ("address" in obj || "bindings" in obj || "messages" in obj)
  );
};

/**
 * Extract and enrich all operations from an AsyncAPI document
 */
export const extractOperations = (
  document: AsyncAPIDocument,
): EnrichedOperation[] => {
  const operations = document.operations ?? {};
  const channels = document.channels ?? {};
  const servers = document.servers ?? {};

  return Object.entries(operations).map(([operationId, operation]) => {
    let channel: ChannelObject | undefined;
    let channelId = "";

    // Handle different channel reference formats:
    // 1. Already dereferenced (channel is the actual channel object)
    // 2. $ref string (need to look up in channels)
    // 3. Object with $ref property (need to look up in channels)
    if (isDereferencedChannel(operation.channel)) {
      // Channel has been dereferenced - use it directly
      channel = operation.channel as ChannelObject;
      // Try to find channel ID by matching address
      channelId =
        Object.entries(channels).find(
          ([, ch]) => ch.address === channel?.address,
        )?.[0] ?? "";
    } else if (typeof operation.channel === "string") {
      // Direct string reference
      channelId = operation.channel.replace("#/channels/", "");
      channel = channels[channelId];
    } else if (operation.channel?.$ref) {
      // Object with $ref property
      channelId = operation.channel.$ref.replace("#/channels/", "");
      channel = channels[channelId];
    }

    // Detect protocols from channel bindings and servers
    const protocols = detectProtocols(channel, servers, channel?.servers ?? []);

    // Get parent tag (first tag)
    const parentTag = operation.tags?.[0]?.name;

    return {
      ...operation,
      operationId,
      channelAddress: channel?.address ?? undefined,
      channelId,
      protocols,
      parentTag,
    };
  });
};

/**
 * Filter operations by action
 */
export const filterOperationsByAction = (
  operations: EnrichedOperation[],
  action: "send" | "receive",
): EnrichedOperation[] => {
  return operations.filter((op) => op.action === action);
};

/**
 * Filter operations by tag
 */
export const filterOperationsByTag = (
  operations: EnrichedOperation[],
  tag: string,
): EnrichedOperation[] => {
  return operations.filter((op) => op.tags?.some((t) => t.name === tag));
};

/**
 * Filter operations by protocol
 */
export const filterOperationsByProtocol = (
  operations: EnrichedOperation[],
  protocol: string,
): EnrichedOperation[] => {
  return operations.filter((op) => op.protocols.includes(protocol));
};

/**
 * Group operations by tag
 */
export const groupOperationsByTag = (
  operations: EnrichedOperation[],
): Map<string | undefined, EnrichedOperation[]> => {
  const grouped = new Map<string | undefined, EnrichedOperation[]>();

  for (const operation of operations) {
    const tag = operation.parentTag;
    if (!grouped.has(tag)) {
      grouped.set(tag, []);
    }
    grouped.get(tag)?.push(operation);
  }

  return grouped;
};

/**
 * Group operations by channel
 */
export const groupOperationsByChannel = (
  operations: EnrichedOperation[],
): Map<string | undefined, EnrichedOperation[]> => {
  const grouped = new Map<string | undefined, EnrichedOperation[]>();

  for (const operation of operations) {
    const channelId = operation.channelId;
    if (!grouped.has(channelId)) {
      grouped.set(channelId, []);
    }
    grouped.get(channelId)?.push(operation);
  }

  return grouped;
};

/**
 * Get all unique tags from operations
 */
export const extractTagsFromOperations = (
  operations: EnrichedOperation[],
): string[] => {
  const tags = new Set<string>();

  for (const operation of operations) {
    operation.tags?.forEach((tag) => {
      if (tag.name) tags.add(tag.name);
    });
  }

  return Array.from(tags);
};

/**
 * Get all unique protocols from operations
 */
export const extractProtocolsFromOperations = (
  operations: EnrichedOperation[],
): string[] => {
  const protocols = new Set<string>();

  for (const operation of operations) {
    operation.protocols.forEach((p) => protocols.add(p));
  }

  return Array.from(protocols);
};

/**
 * Check if document has untagged operations
 */
export const hasUntaggedOperations = (
  operations: EnrichedOperation[],
): boolean => {
  return operations.some((op) => !op.tags?.length);
};

/**
 * Get operations without tags
 */
export const getUntaggedOperations = (
  operations: EnrichedOperation[],
): EnrichedOperation[] => {
  return operations.filter((op) => !op.tags?.length);
};
