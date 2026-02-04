import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../util/cn.js";

const alertVariants = cva(
  "grid gap-0.5 rounded-lg border text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 w-full relative group/alert",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/45 dark:text-blue-200 dark:border-blue-900/75",
        destructive:
          "text-destructive bg-card bg-destructive/5 border-destructive/20 *:data-[slot=alert-description]:text-destructive *:[svg]:text-current",
        warning:
          "text-warning-foreground bg-card bg-warning/5 border-warning/50 *:data-[slot=alert-description]:text-warning-foreground *:[svg]:text-current",
      },
      fit: {
        default: "px-2.5 py-2",
        loose: "p-4",
      },
    },
    defaultVariants: {
      variant: "default",
      fit: "default",
    },
  },
);

function Alert({
  className,
  fit,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, fit }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground text-sm text-balance md:text-pretty [&_p:not(:last-child)]:mb-4 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
