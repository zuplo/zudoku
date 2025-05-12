import React, { type ReactNode } from "react";
import { useRegisterAnchorElement } from "./context/ViewportAnchorContext.js";

import { cva, type VariantProps } from "class-variance-authority";

const heading = cva("group relative", {
  variants: {
    level: {
      6: "text-md",
      5: "text-lg",
      4: "text-xl",
      3: "text-xl font-semibold",
      2: "text-2xl font-bold",
      1: "text-4xl font-extrabold",
    },
  },
  defaultVariants: {
    level: 1,
  },
});

const getComponent = (level: number) => {
  switch (level) {
    case 1:
      return "h1";
    case 2:
      return "h2";
    case 3:
      return "h3";
    case 4:
      return "h4";
    case 5:
      return "h5";
    case 6:
      return "h6";
    default:
      return "h1";
  }
};

export type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof heading> & {
    children: ReactNode;
    className?: string;
    id?: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    registerSidebarAnchor?: boolean;
  };

export const Heading = ({
  level,
  children,
  id,
  className,
  registerSidebarAnchor,
}: HeadingProps) => {
  const Component = getComponent(level ?? 1);
  const { ref } = useRegisterAnchorElement();

  return (
    <Component
      className={heading({ className, level })}
      ref={registerSidebarAnchor ? ref : undefined}
      id={id}
    >
      {id && (
        <a
          href={`#${id}`}
          className="before:content-['#'] no-underline absolute text-primary -left-[0.8em] pr-2.5 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity duration-200"
          aria-label={`Link to ${id}`}
        >
          {/* Zero width space */}
          &#8203;
        </a>
      )}
      {children}
    </Component>
  );
};
