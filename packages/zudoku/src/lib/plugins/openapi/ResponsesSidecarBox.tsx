import * as Tabs from "@radix-ui/react-tabs";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "zudoku/components";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import { cn } from "../../util/cn.js";
import type { ResponseItem } from "./graphql/graphql.js";
import * as SidecarBox from "./SidecarBox.js";
import { SidecarExamples } from "./SidecarExamples.js";

export const ResponsesSidecarBox = ({
  responses,
  selectedResponse,
  isOnScreen,
  shouldLazyHighlight,
}: {
  responses: ResponseItem[];
  selectedResponse?: string;
  isOnScreen: boolean;
  shouldLazyHighlight?: boolean;
}) => {
  const [internalSelectedResponse, setInternalSelectedResponse] = useState(
    selectedResponse ?? responses[0]?.statusCode,
  );
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);

  // Sync from external prop when it changes
  useEffect(() => {
    if (selectedResponse !== undefined) {
      setInternalSelectedResponse(selectedResponse);
    }
  }, [selectedResponse]);

  useEffect(() => {
    if (!internalSelectedResponse) return;

    setSelectedContentIndex(0);
    setSelectedExampleIndex(0);
  }, [internalSelectedResponse]);

  return (
    <Collapsible className="group/collapsible" defaultOpen>
      <SidecarBox.Root>
        <Tabs.Root
          value={internalSelectedResponse}
          onValueChange={(value) => {
            // requestAnimationFrame(() => {
            //   document.getElementById(`${slug}/responses`)?.scrollIntoView();
            // });
            setInternalSelectedResponse(value);
          }}
        >
          <SidecarBox.Head className="text-xs flex justify-between items-center">
            <span className="flex items-center gap-1 font-medium">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="size-fit px-1 py-1 -my-1">
                  <ChevronsDownUpIcon className="size-[1em] group-data-[state=closed]/collapsible:hidden" />
                  <ChevronsUpDownIcon className="size-[1em] group-data-[state=open]/collapsible:hidden" />
                </Button>
              </CollapsibleTrigger>
              Example Responses
            </span>
            <Tabs.List className="flex gap-1.5 me-3 group-data-[state=closed]/collapsible:hidden">
              {responses.map((response) => (
                <Tabs.Trigger
                  key={response.statusCode}
                  value={response.statusCode}
                  className={cn(
                    "text-xs font-mono px-0.5 translate-y-[calc(50%+2px)] cursor-pointer",
                    "data-[state=active]:text-primary data-[state=active]:dark:text-inherit data-[state=active]:shadow-[inset_0_-2px_0_0_var(--primary)]",
                    "hover:border-accent-foreground/25",
                  )}
                >
                  {response.statusCode}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </SidecarBox.Head>
          <CollapsibleContent>
            {responses.map((response) => (
              <Tabs.Content
                key={response.statusCode}
                value={response.statusCode}
              >
                <SidecarExamples
                  selectedContentIndex={selectedContentIndex}
                  selectedExampleIndex={selectedExampleIndex}
                  onExampleChange={(selected) => {
                    setSelectedContentIndex(selected.contentTypeIndex);
                    setSelectedExampleIndex(selected.exampleIndex);
                  }}
                  content={response.content ?? []}
                  isOnScreen={isOnScreen}
                  shouldLazyHighlight={shouldLazyHighlight}
                />
              </Tabs.Content>
            ))}
          </CollapsibleContent>
        </Tabs.Root>
      </SidecarBox.Root>
    </Collapsible>
  );
};
