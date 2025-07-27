import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "../../util/cn.js";
import type { ResponseItem } from "./graphql/graphql.js";
import * as SidecarBox from "./SidecarBox.js";
import { SidecarExamples } from "./SidecarExamples.js";

export const ResponsesSidecarBox = ({
  responses,
  selectedResponse,
  onSelectResponse,
}: {
  responses: ResponseItem[];
  selectedResponse?: string;
  onSelectResponse: (response: string) => void;
}) => {
  return (
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
        {responses.map((response) => (
          <Tabs.Content key={response.statusCode} value={response.statusCode}>
            <SidecarExamples content={response.content ?? []} />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </SidecarBox.Root>
  );
};
