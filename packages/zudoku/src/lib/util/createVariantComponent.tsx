import type { cva, VariantProps } from "class-variance-authority";
import type { ClassValue } from "clsx";
import * as React from "react";
import type { JSX } from "react/jsx-runtime";
import { cn } from "./cn.js";

type CVAFn = ReturnType<typeof cva>;

// Overload for HTML tag with CVA function
function createVariantComponent<
  E extends keyof JSX.IntrinsicElements,
  C extends CVAFn,
>(
  tag: E,
  cvx: C,
): (
  props: JSX.IntrinsicElements[E] & {
    className?: ClassValue;
  } & VariantProps<C>,
) => React.ReactElement;

// Overload for HTML tag with ClassValue
function createVariantComponent<E extends keyof JSX.IntrinsicElements>(
  tag: E,
  cvx: ClassValue,
): (
  props: JSX.IntrinsicElements[E] & { className?: ClassValue },
) => React.ReactElement;

// Overload for React component with CVA function
function createVariantComponent<
  T extends React.ComponentType<Record<string, unknown>>,
  C extends CVAFn,
>(
  Component: T,
  cvx: C,
): (
  props: React.ComponentProps<T> & {
    className?: ClassValue;
  } & VariantProps<C>,
) => React.ReactElement;

// Overload for React component with ClassValue
function createVariantComponent<
  T extends React.ComponentType<Record<string, unknown>>,
>(
  Component: T,
  cvx: ClassValue,
): (
  props: React.ComponentProps<T> & { className?: ClassValue },
) => React.ReactElement;

// Implementation
function createVariantComponent<
  E extends
    | keyof JSX.IntrinsicElements
    | React.ComponentType<Record<string, unknown>>,
>(tagOrComponent: E, cvx: ClassValue | CVAFn) {
  const MyVariant = ({
    className,
    ...props
  }: Record<string, unknown> & { className?: ClassValue }) => {
    const computedClassName =
      typeof cvx === "function"
        ? (
            cvx as (
              p?: Record<string, unknown> & {
                className?: ClassValue;
                class?: ClassValue;
              },
            ) => string
          )({
            ...(props as Record<string, unknown>),
            className,
          })
        : cn(cvx, className);

    return React.createElement(tagOrComponent as React.ElementType, {
      ...props,
      className: computedClassName,
    });
  };

  const displayName =
    typeof tagOrComponent === "string"
      ? `VariantComponent(${tagOrComponent})`
      : `VariantComponent(${(tagOrComponent as React.ComponentType).displayName ?? (tagOrComponent as React.ComponentType).name ?? "Component"})`;

  MyVariant.displayName = displayName;

  return MyVariant;
}

export default createVariantComponent;
