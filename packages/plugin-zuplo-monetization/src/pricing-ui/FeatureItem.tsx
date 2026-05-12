import { CheckIcon } from "lucide-react";
import type { Feature } from "../types/PlanType.js";
import { cn } from "./cn.js";

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
        {feature.value !== undefined ? (
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
