import { cn } from "zudoku";
import { CheckIcon } from "zudoku/icons";

import { Feature } from "../types/PlanType";

export const FeatureItem = ({
  feature,
  className,
}: {
  feature: Feature;
  className?: string;
}) => {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <CheckIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="text-sm">
        {feature.value ? (
          <>
            <span className="font-medium">{feature.name}:</span> {feature.value}
          </>
        ) : (
          feature.name
        )}
      </div>
    </div>
  );
};
