import * as Collapsible from "@radix-ui/react-collapsible";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Markdown } from "../../components/Markdown.js";
import type { SchemaObject } from "../../oas/graphql/index.js";
import { Button } from "../../ui/Button.js";
import { Item, ItemActions, ItemContent, ItemTitle } from "../../ui/Item.js";
import { cn } from "../../util/cn.js";
import { ColorizedParam } from "./ColorizedParam.js";
import { EnumValues } from "./components/EnumValues.js";
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

  const isCollapsible =
    paramSchema.type === "object" ||
    (isArrayType(paramSchema) &&
      "items" in paramSchema &&
      paramSchema.items?.type === "object");

  const shouldRenderDescription = Boolean(
    parameter.description ||
      paramSchema.description ||
      (paramSchema.type === "array" && paramSchema.items?.enum) ||
      paramSchema.enum ||
      paramSchema.example !== undefined ||
      paramSchema.default !== undefined,
  );

  return (
    <Item>
      <ItemContent className="gap-y-2">
        <div>
          <ItemTitle className="inline me-2">
            {isCollapsible ? (
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="hover:underline"
              >
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
              </button>
            ) : (
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
            )}
          </ItemTitle>
          {"\u200B"}
          <ParamInfos
            className="inline"
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
        {shouldRenderDescription && (
          <div className="flex flex-col gap-1.5">
            {parameter.description && (
              <Markdown content={parameter.description} className="prose-sm" />
            )}
            {paramSchema.description && (
              <Markdown
                content={paramSchema.description}
                className="prose-sm"
              />
            )}
            {paramSchema.type === "array" && paramSchema.items?.enum ? (
              <EnumValues values={paramSchema.items.enum} />
            ) : (
              paramSchema.enum && <EnumValues values={paramSchema.enum} />
            )}
            <SchemaExampleAndDefault schema={paramSchema} />
          </div>
        )}
      </ItemContent>

      {isCollapsible && (
        <ItemActions className="self-start">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle parameter"
          >
            {isOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
          </Button>
        </ItemActions>
      )}

      {isCollapsible && (
        <Collapsible.Root
          defaultOpen={false}
          open={isOpen}
          onOpenChange={setIsOpen}
          className={cn("w-full", !isOpen && "contents")}
        >
          <Collapsible.Content asChild>
            <ItemContent>
              <SchemaView
                schema={
                  "items" in paramSchema ? paramSchema.items : paramSchema
                }
              />
            </ItemContent>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </Item>
  );
};
