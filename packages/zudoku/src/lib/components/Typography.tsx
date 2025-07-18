import { cn } from "../util/cn.js";

// other styles are defined in main.css .prose
export const ProseClasses = "prose dark:prose-invert prose-neutral typography";

export const Typography = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn(ProseClasses, className)}>{children}</div>;
};
