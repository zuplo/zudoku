import type { AllHTMLAttributes } from "react";
import { cn } from "../util/cn.js";

// other styles are defined in main.css .prose
export const ProseClasses = "prose dark:prose-invert prose-neutral typography";

export const Typography = ({
  className,
  ...props
}: AllHTMLAttributes<HTMLDivElement>) => {
  return <div className={cn(ProseClasses, className)} {...props} />;
};
