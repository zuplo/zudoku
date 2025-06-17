import { cn } from "../util/cn.js";
import { ProseClasses } from "./Markdown.js";

export const Typography = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn(ProseClasses, className)}>{children}</div>;
};
