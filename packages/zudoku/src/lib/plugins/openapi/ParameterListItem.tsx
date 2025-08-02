import * as Collapsible from "@radix-ui/react-collapsible";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Markdown } from "../../components/Markdown.js";
import type { SchemaObject } from "../../oas/graphql/index.js";
import { Button } from "../../ui/Button.js";
import { ColorizedParam } from "./ColorizedParam.js";
import { EnumValues } from "./components/EnumValues.js";
import { SelectOnClick } from "./components/SelectOnClick.js";
import type { ParameterItem } from "./graphql/graphql.js";
import type { ParameterGroup } from "./OperationListItem.js";
import { ParamInfos } from "./ParamInfos.js";
import { SchemaExampleAndDefault } from "./schema/SchemaExampleAndDefault.js";
import { SchemaView } from "./schema/SchemaView.js";
import { isArrayType } from "./schema/utils.js";

const getParameterSchema = (parameter: ParameterItem): SchemaObject => {
  if (parameter.schema != null && typeof parameter.schema === "object") {
    return parameter.schema;
  }
  return {
    type: "string",
  };
};

export const ParameterListItem = ({
  parameter,
  group,
  id,
}: {
  parameter: ParameterItem;
  group: ParameterGroup;
  id: string;
}) => {
  const paramSchema = getParameterSchema(parameter);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="p-4 bg-border/20 text-sm flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <SelectOnClick asChild>
          <code>
            {group === "path" ? (
              <ColorizedParam
                name={parameter.name}
                backgroundOpacity="15%"
                className="px-2"
                slug={`${id}-${parameter.name}`}
              />
            ) : (
              parameter.name
            )}
          </code>
        </SelectOnClick>
        <ParamInfos
          schema={paramSchema}
          extraItems={[
            parameter.required && (
              <span className="text-primary">required</span>
            ),
            parameter.style && `style: ${parameter.style}`,
            parameter.explode && `explode: ${parameter.explode}`,
          ]}
        />
      </div>
      {parameter.description && (
        <Markdown
          content={parameter.description}
          className="text-sm prose prose-p:my-1 prose-code:whitespace-pre-line"
        />
      )}
      {paramSchema.description && (
        <Markdown
          content={paramSchema.description}
          className="text-sm prose-p:my-1 prose-code:whitespace-pre-line"
        />
      )}
      {paramSchema.type === "array" && paramSchema.items.enum ? (
        <EnumValues values={paramSchema.items.enum} />
      ) : (
        paramSchema.enum && <EnumValues values={paramSchema.enum} />
      )}
      <SchemaExampleAndDefault schema={paramSchema} />
      {(paramSchema.type === "object" || isArrayType(paramSchema)) && (
        <Collapsible.Root
          defaultOpen={false}
          onOpenChange={setIsOpen}
          open={isOpen}
        >
          <Collapsible.Trigger asChild>
            <Button variant="expand" size="sm">
              {isOpen ? <MinusIcon size={12} /> : <PlusIcon size={12} />}
              {isOpen ? "Hide properties" : "Show properties"}
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="mt-2">
              <SchemaView
                schema={
                  "items" in paramSchema ? paramSchema.items : paramSchema
                }
              />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </li>
  );
};
