import { useState } from "react";
import { SyntaxHighlight } from "../../components/SyntaxHighlight.js";
import { type SchemaObject } from "../../oas/graphql/index.js";
import { cn } from "../../util/cn.js";
import type { OperationListItemResult } from "./OperationList.js";
import * as SidecarBox from "./SidecarBox.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";

type Responses = OperationListItemResult["responses"];
export const ResponsesSidecarBox = ({
  responses,
}: {
  responses: Responses;
}) => {
  const [tabIndex, setTabIndex] = useState(0);

  const activeTab = responses[tabIndex];
  const schema = activeTab.content?.[0]?.schema as SchemaObject | undefined;

  return (
    <SidecarBox.Root>
      <SidecarBox.Head className="text-xs grid grid-rows-2 pb-0">
        <span className="font-mono">Example Responses</span>
        <div className="flex gap-2">
          {responses.map((response, index) => (
            <div
              key={response.statusCode}
              onClick={() => setTabIndex(index)}
              className={cn(
                "text-xs font-mono px-1.5 py-1 pb-px translate-y-px border-b-2 border-transparent rounded-t cursor-pointer",
                tabIndex === index
                  ? "text-primary dark:text-inherit border-primary"
                  : "hover:border-accent-foreground/25",
              )}
            >
              {response.statusCode}
            </div>
          ))}
        </div>
      </SidecarBox.Head>
      <SidecarBox.Body>
        {schema ? (
          <SyntaxHighlight
            language="json"
            noBackground
            className="text-xs"
            code={JSON.stringify(generateSchemaExample(schema), null, 2)}
          />
        ) : (
          <span className="text-muted-foreground font-mono italic text-xs">
            Empty Response
          </span>
        )}
      </SidecarBox.Body>
      <SidecarBox.Footer className="flex justify-end text-xs">
        {responses[tabIndex].description}
      </SidecarBox.Footer>
    </SidecarBox.Root>
  );
};
