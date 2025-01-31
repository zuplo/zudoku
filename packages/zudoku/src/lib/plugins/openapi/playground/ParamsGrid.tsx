import { type ReactNode } from "react";
import { cn } from "../../../util/cn.js";
import createVariantComponent from "../../../util/createVariantComponent.js";
const ParamsGrid = createVariantComponent(
  "div",
  "grid grid-cols-[2fr_3fr] gap-2 items-center",
);

export const ParamsGridItem = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "group hover:bg-accent/40 px-3 grid col-span-full grid-cols-subgrid",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default ParamsGrid;
