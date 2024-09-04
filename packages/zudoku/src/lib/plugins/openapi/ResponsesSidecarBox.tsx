import * as Tabs from "@radix-ui/react-tabs";
import { SyntaxHighlight } from "../../components/SyntaxHighlight.js";
import { type SchemaObject } from "../../oas/graphql/index.js";
import { cn } from "../../util/cn.js";
import type { OperationListItemResult } from "./OperationList.js";
import * as SidecarBox from "./SidecarBox.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";

type Responses = OperationListItemResult["responses"];
export const ResponsesSidecarBox = ({
  responses,
  selectedResponse,
  onSelectResponse,
}: {
  responses: Responses;
  selectedResponse?: string;
  onSelectResponse: (response: string) => void;
}) => (
  <SidecarBox.Root>
    <Tabs.Root
      defaultValue={responses[0]?.statusCode}
      value={selectedResponse}
      onValueChange={(value) => onSelectResponse(value)}
    >
      <SidecarBox.Head className="text-xs flex flex-col gap-2 pb-0">
        <span className="font-mono">Example Responses</span>
        <Tabs.List className="flex gap-2">
          {responses.map((response) => (
            <Tabs.Trigger
              key={response.statusCode}
              value={response.statusCode}
              className={cn(
                "text-xs font-mono px-1.5 py-1 pb-px translate-y-px border-b-2 border-transparent rounded-t cursor-pointer",
                "data-[state=active]:text-primary data-[state=active]:dark:text-inherit data-[state=active]:border-primary",
                "hover:border-accent-foreground/25",
              )}
            >
              {response.statusCode}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </SidecarBox.Head>
      {responses.map((response) => {
        const schema = response.content?.[0]?.schema as
          | SchemaObject
          | undefined;

        return (
          <Tabs.Content key={response.statusCode} value={response.statusCode}>
            <SidecarBox.Body className="p-0">
              {schema ? (
                <SyntaxHighlight
                  language="json"
                  noBackground
                  className="text-xs max-h-[450px] p-2"
                  code={JSON.stringify(generateSchemaExample(schema), null, 2)}
                />
              ) : (
                <span className="text-muted-foreground font-mono italic text-xs">
                  Empty Response
                </span>
              )}
            </SidecarBox.Body>
            <SidecarBox.Footer className="flex justify-end text-xs">
              {response.description}
            </SidecarBox.Footer>
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  </SidecarBox.Root>
);
