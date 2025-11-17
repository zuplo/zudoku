import { InfoIcon } from "lucide-react";
import { SyntaxHighlight } from "zudoku/ui/SyntaxHighlight.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "zudoku/ui/Tooltip.js";
import { NonHighlightedCode } from "./components/NonHighlightedCode.js";
import * as SidecarBox from "./SidecarBox.js";

export const GeneratedExampleSidecarBox = ({
  code,
  isOnScreen,
  shouldLazyHighlight,
}: {
  code: string;
  isOnScreen: boolean;
  shouldLazyHighlight?: boolean;
}) => {
  return (
    <SidecarBox.Root>
      <SidecarBox.Head className="text-xs flex justify-between items-center">
        <span className="font-mono">
          Request Body Example
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent>This is a generated example.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
      </SidecarBox.Head>
      <SidecarBox.Body className="p-0">
        {shouldLazyHighlight && !isOnScreen ? (
          <NonHighlightedCode code={code} />
        ) : (
          <SyntaxHighlight embedded language="json" noBackground code={code} />
        )}
      </SidecarBox.Body>
    </SidecarBox.Root>
  );
};
