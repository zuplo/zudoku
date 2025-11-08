import { XIcon } from "lucide-react";
import { Button } from "zudoku/components";
import { Input } from "zudoku/ui/Input.js";
import { cn } from "../../../util/cn.js";
import createVariantComponent from "../../../util/createVariantComponent.js";

const ParamsGrid = createVariantComponent(
  "div",
  "grid grid-cols-[min-content_2fr_3fr] items-center gap-x-5",
);

export const ParamsGridItem = createVariantComponent(
  "div",
  "group h-9 hover:bg-accent/75 ps-4 pe-2 grid col-span-full grid-cols-subgrid items-center border-b",
);

export const ParamsGridInput = createVariantComponent(
  Input,
  "w-full truncate border-0 p-0 m-0 shadow-none text-xs focus-visible:ring-0 font-mono",
);

export const ParamsGridRemoveButton = ({
  onClick,
  className,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) => (
  <Button
    size="icon-xs"
    variant="ghost"
    className={cn(
      "text-muted-foreground opacity-0 group-hover:brightness-95 group-hover:opacity-100",
      className,
    )}
    onClick={onClick}
    type="button"
  >
    <XIcon size={16} />
  </Button>
);

export default ParamsGrid;
