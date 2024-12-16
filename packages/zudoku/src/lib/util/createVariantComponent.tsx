import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { ClassValue } from "clsx";
import * as React from "react";
import type { JSX } from "react/jsx-runtime";
import { cn } from "./cn.js";

const createVariantComponent = <
  E extends keyof React.ReactHTML,
  C extends ReturnType<typeof cva>,
>(
  tag: E,
  cvx: ClassValue | C,
  // variantProps: Array<keyof VariantProps<C>> = [],
) => {
  const MyVariant = React.forwardRef<
    HTMLElement,
    JSX.IntrinsicElements[E] & { className?: ClassValue; asChild?: boolean }
  >(({ className, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : tag;

    return React.createElement(Comp, {
      ...props,
      ref,
      className:
        typeof cvx === "function" ? cvx({ className }) : cn(cvx, className),
    });
  });

  MyVariant.displayName = `VariantComponent(${tag})`;

  return MyVariant;
};

export default createVariantComponent;
