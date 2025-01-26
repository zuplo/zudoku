import { ChevronDownIcon } from "lucide-react";
import { Fragment } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../../ui/Collapsible.js";

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
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
        <span className="font-semibold text-primary">{method}</span>
        <span className="break-all">{url}</span>
        <span className="text-muted-foreground">HTTP/1.1</span>
      </div>

      {headers.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
            <ChevronDownIcon className="h-4 w-4" />
            <span className="font-semibold">Headers</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-[auto,1fr] gap-x-8 gap-y-1 pl-6 pt-2">
              {headers.map(([key, value]) => (
                <Fragment key={key}>
                  <div className="text-primary">{key}</div>
                  <div className="break-words">{value}</div>
                </Fragment>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {body && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
            <ChevronDownIcon className="h-4 w-4" />
            <span className="font-semibold">Body</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-6 pt-2">
              <div className="whitespace-pre-wrap break-all bg-muted p-2 rounded-md">
                {body}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default RequestTab;
