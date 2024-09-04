import { SyntaxHighlight } from "../../components/SyntaxHighlight.js";
import { type SchemaObject } from "../../oas/graphql/index.js";
import type { OperationListItemResult } from "./OperationList.js";
import * as SidecarBox from "./SidecarBox.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";

type Content = NonNullable<
  NonNullable<OperationListItemResult["requestBody"]>["content"]
>;

// @todo should we handle multiple content types?
export const RequestBodySidecarBox = ({ content }: { content: Content }) => {
  if (!content.length) return null;

  return (
    <>
      <SidecarBox.Root>
        <SidecarBox.Head className="text-xs flex justify-between items-center">
          <span className="font-mono">Request Body Example</span>
        </SidecarBox.Head>
        <SidecarBox.Body className="p-0">
          <SyntaxHighlight
            language="json"
            noBackground
            copyable
            className="text-xs max-h-[450px] p-2"
            code={JSON.stringify(
              content.at(0)?.schema
                ? generateSchemaExample(content[0].schema as SchemaObject)
                : "",
              null,
              2,
            )}
          />
        </SidecarBox.Body>
      </SidecarBox.Root>
    </>
  );
};
