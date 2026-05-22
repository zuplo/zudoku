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
  const hasTierBreakdown = !!quota.tierPrices && quota.tierPrices.length > 0;
  // Hide the "X / period" header when the card has no included quota
  // (`isPayg`) or when a tier breakdown already conveys it as an
  // "Up to X: Included" line.
  const showQuotaLine = !quota.isPayg && !hasTierBreakdown;

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <CheckIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="text-sm">
        {showQuotaLine ? (
          <>
            <span className="font-medium">{quota.name}:</span>{" "}
            {quota.limit.toLocaleString()} / {quota.period}
          </>
        ) : (
          <span className="font-medium">{quota.name}</span>
        )}
        {quota.unitPrice && (
          <span className="text-muted-foreground"> — {quota.unitPrice}</span>
        )}
        {hasTierBreakdown && (
          <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {quota.tierPrices?.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
