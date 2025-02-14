import { ChevronRightIcon } from "lucide-react";
import { Fragment } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../../ui/Collapsible.js";
import { cn } from "../../../../util/cn.js";
import { methodForColor } from "../../util/methodToColor.js";

export const RequestTab = ({
  method,
  url,
  headers,
  body,
}: {
  method: string;
  url: string;
  headers: Array<[string, string]>;
  body?: string;
}) => {
  return (
    <div className="flex flex-col gap-2 font-mono text-xs">
      <div className="gap-2 p-2 bg-muted rounded-md">
        <span className={cn(methodForColor(method), "font-semibold")}>
          {method}
        </span>
        &nbsp;
        <span className="break-all">{url}</span>&nbsp;
        <span className="text-muted-foreground">HTTP/1.1</span>
      </div>
      <div className="mx-1.5 flex flex-col gap-3">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary group">
            <ChevronRightIcon className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-[90deg]" />
            <span className="font-semibold">Headers</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-[auto,1fr] gap-x-8 gap-y-1 pl-1.5 pt-2">
              {headers.map(([key, value]) => (
                <Fragment key={key}>
                  <div className="text-primary">{key}</div>
                  <div className="break-all">{value}</div>
                </Fragment>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary group">
            <ChevronRightIcon className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-[90deg]" />
            <span className="font-semibold">Body</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-0 pt-2">
              <div
                className={cn(
                  "whitespace-pre-wrap break-all bg-muted p-2 rounded-md",
                  !body && "text-muted-foreground",
                )}
              >
                {body ?? "Empty body"}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default RequestTab;
