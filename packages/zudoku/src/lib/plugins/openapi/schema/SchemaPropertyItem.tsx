import * as Collapsible from "@radix-ui/react-collapsible";
import { MinusIcon, PlusIcon, RefreshCcwDotIcon } from "lucide-react";
import { useState } from "react";
import { InlineCode } from "../../../components/InlineCode.js";
import { Markdown } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Button } from "../../../ui/Button.js";
import { ConstValue } from "../components/ConstValue.js";
import { EnumValues } from "../components/EnumValues.js";
import { SelectOnClick } from "../components/SelectOnClick.js";
import { ParamInfos } from "../ParamInfos.js";
import { AllOfGroupView } from "./AllOfGroup/AllOfGroupView.js";
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
    className="inline-flex items-center gap-1.5 italic text-xs translate-y-0.5"
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
      <li className="p-4 bg-border/20 hover:bg-border/30">
        <div className="flex flex-col gap-2.5 justify-between text-sm">
          <div className="space-x-2 rtl:space-x-reverse">
            <code>{name}</code>
            <ParamInfos
              schema={schema}
              extraItems={[<RecursiveIndicator key="circular-ref" />]}
            />
          </div>
          <SchemaExampleAndDefault schema={schema} />
        </div>
      </li>
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

  return (
    <li className="p-4 bg-border/20 hover:bg-border/30">
      <div className="flex flex-col gap-2.5 justify-between text-sm">
        <div className="space-x-2 rtl:space-x-reverse">
          <SelectOnClick asChild>
            <code>{name}</code>
          </SelectOnClick>
          <ParamInfos
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
        {schema.description && (
          <Markdown
            className="text-sm leading-normal"
            content={schema.description}
          />
        )}
        {schema.type === "array" && "items" in schema && schema.items.enum && (
          <EnumValues values={schema.items.enum} />
        )}
        {schema.const && <ConstValue schema={schema} hideDescription />}
        {schema.enum && <EnumValues values={schema.enum} />}
        <SchemaExampleAndDefault schema={schema} />

        {isCollapsible && (
          <Collapsible.Root
            defaultOpen={defaultOpen}
            open={isOpen}
            onOpenChange={() => setIsOpen(!isOpen)}
          >
            {showCollapseButton && (
              <Collapsible.Trigger asChild>
                <Button variant="expand" size="sm">
                  {isOpen ? <MinusIcon size={12} /> : <PlusIcon size={12} />}
                  {!isOpen ? "Show properties" : "Hide properties"}
                </Button>
              </Collapsible.Trigger>
            )}
            <Collapsible.Content>
              <div className="mt-2">
                {schema.allOf ? (
                  <AllOfGroupView schema={schema} />
                ) : schema.anyOf || schema.oneOf || schema.type === "object" ? (
                  <SchemaView schema={schema} />
                ) : isArrayType(schema) && "items" in schema ? (
                  <SchemaView schema={schema.items} />
                ) : null}
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
      </div>
    </li>
  );
};
