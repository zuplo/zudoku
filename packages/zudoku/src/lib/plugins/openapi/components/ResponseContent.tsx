import * as Tabs from "@radix-ui/react-tabs";
import { useState } from "react";
import { Badge } from "zudoku/ui/Badge.js";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
import { cn } from "zudoku/ui/util.js";
import { Markdown } from "../../../components/Markdown.js";
import type { MediaTypeObject } from "../graphql/graphql.js";
import { SchemaView } from "../schema/SchemaView.js";

type Response = {
  statusCode: string;
  description?: string | null;
  content?: MediaTypeObject[] | null;
};

export const ResponseContent = ({
  responses,
  selectedResponse,
  onSelectResponse,
}: {
  responses: Response[];
  selectedResponse?: string;
  onSelectResponse?: (value: string) => void;
}) => {
  const [selectedMediaType, setSelectedMediaType] = useState(
    responses[0]?.content?.[0]?.mediaType ?? "",
  );
  const currentResponse =
    responses.find((r) => r.statusCode === selectedResponse) ?? responses[0];

  const hideTabs =
    responses.length === 1 && responses.at(0)?.statusCode === "200";

  const cardHeader = (
    <div className="flex flex-col text-muted-foreground">
      <div
        className={cn(
          "flex flex-row items-center gap-2 justify-between",
          !hideTabs && "px-4 py-1.5 border-b",
        )}
      >
        {!hideTabs && (
          <Tabs.List className="flex flex-row font-medium text-sm gap-4">
            {responses.map((response) => (
              <Tabs.Trigger
                key={response.statusCode}
                value={response.statusCode}
                className={cn(
                  "py-0.5 h-fit -mx-2 px-2 rounded-md",
                  "data-[state=active]:dark:ring-1 data-[state=active]:dark:ring-border data-[state=active]:bg-background data-[state=active]:drop-shadow",
                  "data-[state=active]:font-semibold data-[state=active]:text-foreground",
                )}
              >
                {response.statusCode}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        )}
        {currentResponse?.content && currentResponse.content.length > 1 && (
          <NativeSelect
            value={selectedMediaType}
            onChange={(e) => setSelectedMediaType(e.target.value)}
            className="text-xs h-fit py-1 bg-background"
          >
            {currentResponse.content.map((c) => (
              <NativeSelectOption key={c.mediaType} value={c.mediaType}>
                {c.mediaType}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      </div>
      <div className="p-2 clear-both">
        {hideTabs && (
          <Badge variant="outline" className="float-start me-2">
            {currentResponse?.statusCode}
          </Badge>
        )}
        {currentResponse?.description && (
          <Markdown
            className="text-sm text-muted-foreground max-w-none"
            content={currentResponse.description}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <Tabs.Root
        value={selectedResponse}
        onValueChange={(value) => {
          onSelectResponse?.(value);
          const newResponse = responses.find((r) => r.statusCode === value);
          setSelectedMediaType(newResponse?.content?.[0]?.mediaType ?? "");
        }}
      >
        {responses.map((response) => (
          <Tabs.Content key={response.statusCode} value={response.statusCode}>
            <SchemaView
              schema={
                response.content?.find(
                  (content) => content.mediaType === selectedMediaType,
                )?.schema
              }
              cardHeader={cardHeader}
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
};
