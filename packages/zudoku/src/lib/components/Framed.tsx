import { cva } from "class-variance-authority";
import type { PropsWithChildren } from "react";
import { cn } from "../util/cn.js";

const frameVariants = cva("", {
  variants: {
    size: {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      full: "max-w-full",
    },
    align: {
      center: "mx-auto",
      start: "me-auto",
      end: "ms-auto",
    },
  },
  defaultVariants: {
    size: "xl",
    align: "center",
  },
});

export const Framed = ({
  caption,
  className,
  size = "xl",
  align = "center",
  children,
}: PropsWithChildren<{
  caption?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  align?: "center" | "start" | "end";
}>) => (
  <figure className={cn(frameVariants({ size, align }), className)}>
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
