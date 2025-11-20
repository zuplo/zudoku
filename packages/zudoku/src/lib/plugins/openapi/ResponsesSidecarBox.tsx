import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "zudoku/components";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
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

  useEffect(() => {
    if (!selectedResponse) return;

    setInternalSelectedResponse(selectedResponse);
  }, [selectedResponse]);

  useEffect(() => {
    if (!internalSelectedResponse) return;

    setSelectedContentIndex(0);
    setSelectedExampleIndex(0);
  }, [internalSelectedResponse]);

  return (
    <Collapsible className="group/collapsible" defaultOpen>
      <SidecarBox.Root>
        <SidecarBox.Head className="text-xs flex justify-between items-center">
          <div className="flex items-center gap-1 font-medium shrink-0">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="size-fit px-1 py-1 -my-1"
                aria-label="Toggle response examples"
              >
                <ChevronsDownUpIcon className="size-[1em] group-data-[state=closed]/collapsible:hidden" />
                <ChevronsUpDownIcon className="size-[1em] group-data-[state=open]/collapsible:hidden" />
              </Button>
            </CollapsibleTrigger>
            Example Responses
          </div>
          <div className="group-data-[state=closed]/collapsible:hidden">
            <NativeSelect
              className="text-xs h-fit py-1 -my-1 bg-background"
              value={internalSelectedResponse}
              onChange={(e) => setInternalSelectedResponse(e.target.value)}
            >
              {responses.map((response) => (
                <NativeSelectOption
                  key={response.statusCode}
                  value={response.statusCode}
                >
                  {response.statusCode}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </SidecarBox.Head>
        <CollapsibleContent>
          <SidecarExamples
            selectedContentIndex={selectedContentIndex}
            selectedExampleIndex={selectedExampleIndex}
            onExampleChange={(selected) => {
              setSelectedContentIndex(selected.contentTypeIndex);
              setSelectedExampleIndex(selected.exampleIndex);
            }}
            content={
              responses.find((r) => r.statusCode === internalSelectedResponse)
                ?.content ?? []
            }
            isOnScreen={isOnScreen}
            shouldLazyHighlight={shouldLazyHighlight}
          />
        </CollapsibleContent>
      </SidecarBox.Root>
    </Collapsible>
  );
};
