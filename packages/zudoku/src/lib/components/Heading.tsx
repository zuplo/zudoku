import type { HTMLAttributes, ReactNode } from "react";
import { useRegisterAnchorElement } from "./context/ViewportAnchorContext.js";

import { cva, type VariantProps } from "class-variance-authority";
import { LinkIcon } from "lucide-react";
import { cn } from "../util/cn.js";

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

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> &
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
      className={heading({
        className: cn(className, "flex items-center gap-[0.33em]"),
        level,
      })}
      ref={registerSidebarAnchor ? ref : undefined}
      id={id}
    >
      {children}
      {id && (
        <a
          href={`#${id}`}
          className="rounded text-[0.8em] text-muted-foreground p-0.5 -m-0.5 opacity-0 group-hover:opacity-50 hover:text-primary hover:!opacity-100 transition-opacity duration-200"
          aria-label={`Link to ${id}`}
        >
          <LinkIcon className="size-[0.75em] min-w-4 min-h-4" />
        </a>
      )}
    </Component>
  );
};
