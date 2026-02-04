import { cn } from "../../../util/cn.js";
import { getActionColor } from "../util/protocolToColor.js";

type OperationBadgeProps = {
  action: "send" | "receive" | string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Badge component for displaying operation actions (SEND, RECEIVE)
 *
 * Colors can be customized via CSS variables in your theme:
 * - --asyncapi-action-send-bg / --asyncapi-action-send-text
 * - --asyncapi-action-receive-bg / --asyncapi-action-receive-text
 */
export const OperationBadge = ({
  action,
  className,
  size = "md",
}: OperationBadgeProps) => {
  const { style } = getActionColor(action);

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
    lg: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-semibold uppercase whitespace-nowrap shrink-0",
        sizeClasses[size],
        className,
      )}
      style={style}
    >
      {action}
    </span>
  );
};
