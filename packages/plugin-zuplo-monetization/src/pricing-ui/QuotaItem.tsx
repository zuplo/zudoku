import type { Quota } from "../types/PlanType.js";
import { CheckIcon } from "./CheckIcon.js";
import { cn } from "./cn.js";

export const QuotaItem = ({
  quota,
  className,
}: {
  quota: Quota;
  className?: string;
}) => {
  if (quota.isPayg) {
    return (
      <div className={cn("flex items-start gap-2", className)}>
        <CheckIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-medium">{quota.name}</span>
          {quota.unitPrice && (
            <span className="text-muted-foreground"> — {quota.unitPrice}</span>
          )}
          {quota.tierPrices && quota.tierPrices.length > 0 && (
            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
              {quota.tierPrices.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <CheckIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="text-sm">
        <span className="font-medium">{quota.name}:</span>{" "}
        {quota.limit.toLocaleString()} / {quota.period}
        {quota.tierPrices && quota.tierPrices.length > 0 && (
          <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {quota.tierPrices.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {quota.overagePrice && (
          <div className="text-xs text-muted-foreground mt-0.5">
            +{quota.overagePrice} after quota
          </div>
        )}
      </div>
    </div>
  );
};
