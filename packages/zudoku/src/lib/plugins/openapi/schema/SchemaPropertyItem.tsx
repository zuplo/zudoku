import * as Collapsible from "@radix-ui/react-collapsible";
import { MinusIcon, PlusIcon, RefreshCcwDotIcon } from "lucide-react";
import { useState } from "react";
import { Item, ItemActions, ItemContent, ItemTitle } from "zudoku/ui/Item.js";
import { InlineCode } from "../../../components/InlineCode.js";
import { Markdown } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Button } from "../../../ui/Button.js";
import { cn } from "../../../util/cn.js";
import { ConstValue } from "../components/ConstValue.js";
import { EnumValues } from "../components/EnumValues.js";
import { ParamInfos } from "../ParamInfos.js";
import { SchemaExampleAndDefault } from "./SchemaExampleAndDefault.js";
import { SchemaView } from "./SchemaView.js";
import {
  extractCircularRefInfo,
  isArrayCircularRef,
  isArrayType,
  isCircularRef,
  isComplexType,
} from "./utils.js";

const RecursiveIndicator = ({ circularProp }: { circularProp?: string }) => (
  <InlineCode
    className="inline-flex items-center gap-1.5 text-xs translate-y-0.5"
    selectOnClick={false}
  >
    <RefreshCcwDotIcon size={13} />
    <span>{circularProp ? `${circularProp} (circular)` : "circular"}</span>
  </InlineCode>
);

export const SchemaPropertyItem = ({
  name,
  schema,
  group,
  defaultOpen = false,
  showCollapseButton = true,
}: {
  name: string;
  schema: SchemaObject;
  group: "required" | "optional" | "deprecated";
  defaultOpen?: boolean;
  showCollapseButton?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isCircularRef(schema)) {
    return (
      <Item>
        <ItemContent className="gap-y-2">
          <div>
            <ItemTitle className="inline me-2">
              <code>{name}</code>
            </ItemTitle>
            {"\u200B"}
            <ParamInfos
              className="inline"
              schema={schema}
              extraItems={[
                group !== "optional" && (
                  <span className="text-primary">required</span>
                ),
                <RecursiveIndicator key="circular-ref" />,
              ]}
            />
          </div>
          <SchemaExampleAndDefault schema={schema} />
        </ItemContent>
      </Item>
    );
  }

  const isCollapsible = Boolean(
    (schema.allOf ||
      schema.anyOf ||
      schema.oneOf ||
      isComplexType(schema) ||
      (isArrayType(schema) &&
        "items" in schema &&
        isComplexType(schema.items)) ||
      schema.additionalProperties) &&
      !isArrayCircularRef(schema),
  );

  const shouldRenderDescription = Boolean(
    schema.description ||
      ("items" in schema && schema.items?.enum) ||
      schema.const ||
      schema.enum ||
      schema.example !== undefined ||
      schema.default !== undefined,
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
                <code>{name}</code>
              </button>
            ) : (
              <code>{name}</code>
            )}
          </ItemTitle>
          {"\u200B"}
          <ParamInfos
            className="inline"
            schema={schema}
            extraItems={[
              group !== "optional" && (
                <span className="text-primary">required</span>
              ),
              isArrayCircularRef(schema) && (
                <RecursiveIndicator
                  circularProp={extractCircularRefInfo(schema.items)}
                />
              ),
            ]}
          />
        </div>
        {shouldRenderDescription && (
          <div className="flex flex-col gap-1.5">
            {schema.description && (
              <Markdown className="prose-sm" content={schema.description} />
            )}
            {"items" in schema && schema.items?.enum && (
              <EnumValues values={schema.items.enum} />
            )}
            {schema.const && <ConstValue schema={schema} hideDescription />}
            {schema.enum && <EnumValues values={schema.enum} />}
            <SchemaExampleAndDefault schema={schema} />
          </div>
        )}
      </ItemContent>

      {isCollapsible && showCollapseButton && (
        <ItemActions className="self-start">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle properties"
          >
            {isOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
          </Button>
        </ItemActions>
      )}

      {isCollapsible && (
        <Collapsible.Root
          defaultOpen={defaultOpen}
          open={isOpen}
          onOpenChange={setIsOpen}
          className={cn("w-full", !isOpen && "contents")}
        >
          <Collapsible.Content asChild>
            <ItemContent>
              {schema.anyOf || schema.oneOf || schema.type === "object" ? (
                <SchemaView schema={schema} />
              ) : isArrayType(schema) && "items" in schema ? (
                <SchemaView schema={schema.items} />
              ) : null}
            </ItemContent>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </Item>
  );
};
