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
        <div className="flex items-center gap-1.5">
          <span className="font-medium">Example Request Body</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon size={13} />
              </TooltipTrigger>
              <TooltipContent>
                This example is auto-generated from the schema.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SidecarBox.Head>
      <SidecarBox.Body className="p-0">
        {shouldLazyHighlight && !isOnScreen ? (
          <NonHighlightedCode code={code} />
        ) : (
          <SyntaxHighlight
            embedded
            language="json"
            code={code}
            className="[--scrollbar-color:gray] rounded-none text-xs max-h-[200px]"
          />
        )}
      </SidecarBox.Body>
    </SidecarBox.Root>
  );
};
