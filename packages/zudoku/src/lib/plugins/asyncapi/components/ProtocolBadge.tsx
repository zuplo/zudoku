import { getProtocolDisplayName } from "../../../asyncapi/parser/protocol.js";
import { cn } from "../../../util/cn.js";
import { getProtocolColor } from "../util/protocolToColor.js";

type ProtocolBadgeProps = {
  protocol: string;
  className?: string;
};

/**
 * Protocol label component for displaying protocol types (WebSocket, MQTT, Kafka, etc.)
 * Uses plain text style matching OpenAPI HTTP method display.
 */
export const ProtocolBadge = ({ protocol, className }: ProtocolBadgeProps) => {
  const { textClass } = getProtocolColor(protocol);
  const displayName = getProtocolDisplayName(protocol);

  return <span className={cn(textClass, className)}>{displayName}</span>;
};
