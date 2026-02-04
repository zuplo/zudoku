import { getProtocolDisplayName } from "../../../asyncapi/parser/protocol.js";
import { cn } from "../../../util/cn.js";
import { getProtocolColor } from "../util/protocolToColor.js";

type ProtocolBadgeProps = {
  protocol: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Badge component for displaying protocol types (WebSocket, MQTT, Kafka, etc.)
 *
 * Colors can be customized via CSS variables in your theme:
 * - --asyncapi-protocol-ws-bg / --asyncapi-protocol-ws-text (WebSocket)
 * - --asyncapi-protocol-mqtt-bg / --asyncapi-protocol-mqtt-text (MQTT)
 * - --asyncapi-protocol-kafka-bg / --asyncapi-protocol-kafka-text (Kafka)
 * - --asyncapi-protocol-amqp-bg / --asyncapi-protocol-amqp-text (AMQP)
 * - --asyncapi-protocol-http-bg / --asyncapi-protocol-http-text (HTTP)
 * etc.
 */
export const ProtocolBadge = ({
  protocol,
  className,
  size = "md",
}: ProtocolBadgeProps) => {
  const { style } = getProtocolColor(protocol);
  const displayName = getProtocolDisplayName(protocol);

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
    lg: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-medium whitespace-nowrap shrink-0",
        sizeClasses[size],
        className,
      )}
      style={style}
    >
      {displayName}
    </span>
  );
};
