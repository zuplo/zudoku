import * as Tabs from "@radix-ui/react-tabs";
import { useState } from "react";
import { Markdown } from "zudoku/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { cn } from "zudoku/ui/util.js";
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

  const cardHeader = (
    <div className="flex flex-col bg-muted text-muted-foreground">
      <div className="flex flex-row items-center gap-2 justify-between px-4 py-2">
        <Tabs.List className="flex flex-row font-medium text-sm gap-4">
          {responses.map((response) => (
            <Tabs.Trigger
              key={response.statusCode}
              value={response.statusCode}
              className={cn(
                "py-1 -mx-2 px-2 rounded-md",
                "data-[state=active]:dark:ring-1 data-[state=active]:dark:ring-border data-[state=active]:bg-background data-[state=active]:drop-shadow",
                "data-[state=active]:font-semibold data-[state=active]:text-foreground",
              )}
            >
              {response.statusCode}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {currentResponse?.content && currentResponse.content.length > 1 && (
          <Select
            value={selectedMediaType}
            onValueChange={setSelectedMediaType}
          >
            <SelectTrigger className="h-8 mt-0 max-w-48 text-xs truncate">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {currentResponse.content.map((c) => (
                <SelectItem key={c.mediaType} value={c.mediaType}>
                  {c.mediaType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {currentResponse?.description && (
        <Markdown
          className="text-sm border-t px-4 py-2 text-muted-foreground"
          content={currentResponse.description}
        />
      )}
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
        {responses.map((response) => {
          const content = response.content?.find(
            (c) => c.mediaType === selectedMediaType,
          );
          return (
            <Tabs.Content key={response.statusCode} value={response.statusCode}>
              <SchemaView schema={content?.schema} cardHeader={cardHeader} />
            </Tabs.Content>
          );
        })}
      </Tabs.Root>
    </div>
  );
};
