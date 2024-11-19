import { SyntaxHighlight } from "../../components/SyntaxHighlight.js";
import { type SchemaObject } from "../../oas/graphql/index.js";
import { CollapsibleCode } from "./CollapsibleCode.js";
import type { OperationListItemResult } from "./OperationList.js";
import * as SidecarBox from "./SidecarBox.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";

type Content = NonNullable<
  NonNullable<OperationListItemResult["requestBody"]>["content"]
>;

// @todo should we handle multiple content types?
export const RequestBodySidecarBox = ({ content }: { content: Content }) => {
  if (!content.length) return null;

  const firstContent = content.at(0);

  const example =
    firstContent?.examples?.at(0)?.value ??
    (firstContent?.schema
      ? generateSchemaExample(firstContent.schema as SchemaObject)
      : "");

  return (
    <>
      <SidecarBox.Root>
        <SidecarBox.Head className="text-xs flex justify-between items-center">
          <span className="font-mono">Request Body Example</span>
        </SidecarBox.Head>
        <SidecarBox.Body className="p-0">
          <CollapsibleCode>
            <SyntaxHighlight
              language={example ? "json" : "plain"}
              noBackground
              copyable
              className="[--scrollbar-color:gray] text-xs max-h-[500px] p-2"
              code={example ? JSON.stringify(example, null, 2) : "No example"}
            />
          </CollapsibleCode>
        </SidecarBox.Body>
      </SidecarBox.Root>
    </>
  );
};
