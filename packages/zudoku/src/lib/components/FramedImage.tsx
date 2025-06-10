import type { PropsWithChildren } from "react";
import { cn } from "../util/cn.js";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
} as const;

export function FramedImage({
  caption,
  className,
  size = "xl",
  children,
}: PropsWithChildren<{
  caption?: string;
  className?: string;
  size?: keyof typeof sizeClasses;
}>) {
  return (
    <figure className={cn("mx-auto", sizeClasses[size], className)}>
      <div className="relative overflow-hidden rounded-lg border border-border bg-muted/50 p-1 shadow-sm">
        <div className="not-prose rounded-md [&_img]:rounded-md! relative overflow-hidden bg-background">
          {children}
        </div>
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
