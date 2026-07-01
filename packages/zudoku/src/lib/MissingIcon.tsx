import { CircleDashed, type LucideProps } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/Tooltip.js";
import { parseIconName } from "./util/iconName.js";

export const MissingIcon = ({
  name,
  ...props
}: LucideProps & { name?: string }) => {
  // Link to the set the icon belongs to (lucide, ph, mdi, …), not always lucide.
  const href = name
    ? `https://icon-sets.iconify.design/${parseIconName(name).prefix}/`
    : "https://icon-sets.iconify.design/";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="text-red-500">
          <CircleDashed {...props} />
        </TooltipTrigger>
        <TooltipContent>
          {name ? `Icon "${name}" not found` : "Icon not found"}, see: {href}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
