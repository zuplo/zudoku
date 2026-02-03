import { cn } from "../../../util/cn.js";
import { getActionColor } from "../util/protocolToColor.js";

type OperationBadgeProps = {
  action: "send" | "receive" | string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Badge component for displaying operation actions (SEND, RECEIVE)
 */
export const OperationBadge = ({
  action,
  className,
  size = "md",
}: OperationBadgeProps) => {
  const { bg, text } = getActionColor(action);

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
    lg: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-semibold uppercase whitespace-nowrap shrink-0",
        bg,
        text,
        sizeClasses[size],
        className,
      )}
    >
      {action}
    </span>
  );
};
