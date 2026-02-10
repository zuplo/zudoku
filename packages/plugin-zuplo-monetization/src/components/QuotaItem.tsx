import { cn } from "zudoku";
import { CheckIcon } from "zudoku/icons";

import type { Quota } from "../types/PlanType";

export const QuotaItem = ({
  quota,
  className,
}: {
  quota: Quota;
  className?: string;
}) => {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <CheckIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="text-sm">
        <span className="font-medium">{quota.name}:</span>{" "}
        {quota.limit.toLocaleString()} / {quota.period}
        {quota.overagePrice && (
          <div className="text-xs text-muted-foreground mt-0.5">
            +{quota.overagePrice} after quota
          </div>
        )}
      </div>
    </div>
  );
};
