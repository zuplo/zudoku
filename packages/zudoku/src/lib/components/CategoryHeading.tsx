import { cx } from "class-variance-authority";
import type { ReactNode } from "react";

export const CategoryHeading = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cx("text-sm font-semibold text-primary", className)}
      data-pagefind-ignore="all"
    >
      {children}
    </div>
  );
};
