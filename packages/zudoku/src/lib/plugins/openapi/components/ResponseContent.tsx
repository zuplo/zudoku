import * as Tabs from "@radix-ui/react-tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { type ReactNode, useState } from "react";
import { Badge } from "zudoku/ui/Badge.js";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
import { cn } from "zudoku/ui/util.js";
import { Heading } from "../../../components/Heading.js";
import { Markdown } from "../../../components/Markdown.js";
import type { Content } from "../interfaces.js";
import { ParameterItemList } from "../ParameterList.js";
import type { ParameterListItemData } from "../ParameterListItem.js";
import { SchemaView } from "../schema/SchemaView.js";
import { withBinaryMediaType } from "../schema/utils.js";

type Response = {
  statusCode: string;
  description?: string | null;
  content?: Content[] | null;
  headers?: ParameterListItemData[] | null;
};

const ResponseSectionHeading = ({
  id,
  summary,
  statusCode,
  children,
}: {
  id: string;
  summary?: string;
  statusCode: string;
  children: ReactNode;
}) => (
  <Heading
    level={4}
    id={id}
    className="px-2 pt-3 pb-2 text-sm! font-semibold text-foreground"
  >
    {summary && (
      <VisuallyHidden>
        {summary} &rsaquo; {statusCode} &rsaquo;{" "}
      </VisuallyHidden>
    )}
    {children}
  </Heading>
);

export const ResponseContent = ({
  id,
  summary,
  responses,
  selectedResponse,
  onSelectResponse,
}: {
  id: string;
  summary?: string;
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

  const renderResponseSections = (response: Response) => (
    <>
      {response.headers && response.headers.length > 0 && (
        <>
          <ResponseSectionHeading
            id={`${id}/responses/${response.statusCode}/headers`}
            summary={summary}
            statusCode={response.statusCode}
          >
            Headers
          </ResponseSectionHeading>
          <ParameterItemList
            parameters={response.headers}
            group="header"
            id={id}
          />
        </>
      )}
      <ResponseSectionHeading
        id={`${id}/responses/${response.statusCode}/body`}
        summary={summary}
        statusCode={response.statusCode}
      >
        Body
      </ResponseSectionHeading>
    </>
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
              schema={withBinaryMediaType(
                response.content?.find(
                  (content) => content.mediaType === selectedMediaType,
                )?.schema,
                selectedMediaType,
              )}
              cardHeader={
                <>
                  {cardHeader}
                  {renderResponseSections(response)}
                </>
              }
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
};
