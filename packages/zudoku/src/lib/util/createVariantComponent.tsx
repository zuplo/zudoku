import { Slot } from "@radix-ui/react-slot";
import type { cva } from "class-variance-authority";
import type { ClassValue } from "clsx";
import type { HTMLElementType, JSX } from "react";
import * as React from "react";
import { cn } from "./cn.js";

type ComponentOrElement =
  | HTMLElementType
  // biome-ignore lint/suspicious/noExplicitAny: Need to accept any component type
  | React.ComponentType<any>
  // biome-ignore lint/suspicious/noExplicitAny: Need to accept any component type
  | React.ForwardRefExoticComponent<any>;

type PropsOf<T> = T extends HTMLElementType
  ? JSX.IntrinsicElements[T]
  : T extends React.ComponentType<infer P>
    ? P
    : T extends React.ForwardRefExoticComponent<infer P>
      ? P
      : never;

type RefOf<T> = T extends HTMLElementType
  ? T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T]
    : HTMLElement
  : T extends React.ForwardRefExoticComponent<React.RefAttributes<infer R>>
    ? R
    : HTMLElement;

const createVariantComponent = <
  E extends ComponentOrElement,
  C extends ReturnType<typeof cva>,
>(
  tag: E,
  cvx: ClassValue | C,
  // variantProps: Array<keyof VariantProps<C>> = [],
) => {
  const MyVariant = React.forwardRef<
    RefOf<E>,
    PropsOf<E> & { className?: ClassValue; asChild?: boolean }
  >(({ className, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : tag;

    return React.createElement(Comp, {
      ...props,
      ref: ref as React.Ref<HTMLElement>,
      className:
        typeof cvx === "function" ? cvx({ className }) : cn(cvx, className),
    });
  });

  MyVariant.displayName =
    typeof tag === "string"
      ? `VariantComponent(${tag})`
      : `VariantComponent(${tag.displayName || tag.name || "Component"})`;

  return MyVariant;
};

export default createVariantComponent;
