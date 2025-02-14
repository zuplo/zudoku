import { CircleDashed, LucideProps } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/Tooltip.js";

export const MissingIcon = (props: LucideProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="text-red-500">
          <CircleDashed {...props} />
        </TooltipTrigger>
        <TooltipContent>
          Icon not found, see: https://lucide.dev/icons/
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
