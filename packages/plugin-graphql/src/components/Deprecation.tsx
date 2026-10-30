import { cn } from "zudoku";
import { Markdown } from "zudoku/components";
import { TriangleAlertIcon } from "zudoku/icons";
import { Badge } from "zudoku/ui/Badge.js";

export const DeprecatedBadge = ({ className }: { className?: string }) => (
  <Badge variant="warning" className={cn("font-normal", className)}>
    <TriangleAlertIcon aria-hidden="true" />
    deprecated
  </Badge>
);

export const DeprecationReason = ({ reason }: { reason: string }) => (
  <div className="rounded-lg bg-warning/20 p-2">
    <Markdown className="text-sm [&>p]:m-0" content={reason} />
  </div>
);
