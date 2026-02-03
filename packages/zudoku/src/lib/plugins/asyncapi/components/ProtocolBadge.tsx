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
 */
export const ProtocolBadge = ({
  protocol,
  className,
  size = "md",
}: ProtocolBadgeProps) => {
  const { bg, text } = getProtocolColor(protocol);
  const displayName = getProtocolDisplayName(protocol);

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
    lg: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-medium whitespace-nowrap shrink-0 border border-transparent",
        bg,
        text,
        sizeClasses[size],
        className,
      )}
    >
      {displayName}
    </span>
  );
};
