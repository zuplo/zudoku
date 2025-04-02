import * as Collapsible from "@radix-ui/react-collapsible";
import { MinusIcon, PlusIcon, RefreshCcwDotIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { InlineCode } from "../../../components/InlineCode.js";
import { Markdown, ProseClasses } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Button } from "../../../ui/Button.js";
import { cn } from "../../../util/cn.js";
import { objectEntries } from "../../../util/objectEntries.js";
import { EnumValues } from "../components/EnumValues.js";
import { SelectOnClick } from "../components/SelectOnClick.js";
import { ParamInfos } from "../ParamInfos.js";
import { LogicalGroup } from "./LogicalGroup/LogicalGroup.js";
import { SchemaExampleAndDefault } from "./SchemaExampleAndDefault.js";
import { SchemaView } from "./SchemaView.js";
import {
  hasLogicalGroupings,
  isCircularRef,
  isComplexType,
  LogicalSchemaTypeMap,
} from "./utils.js";

export const SchemaLogicalGroup = ({ schema }: { schema: SchemaObject }) => {
  const [isOpen, setIsOpen] = useState(true);
  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  for (const [key, type] of objectEntries(LogicalSchemaTypeMap)) {
    if (!schema[key]) continue;

    return (
      <LogicalGroup
        schemas={schema[key]}
        type={type}
        isOpen={isOpen}
        toggleOpen={toggleOpen}
      />
    );
  }
};

const RecursiveIndicator = () => (
  <InlineCode
    className="inline-flex items-center gap-1.5 italic text-xs translate-y-0.5"
    selectOnClick={false}
  >
    <RefreshCcwDotIcon size={13} />
    <span>circular</span>
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
          <div className="space-x-2">
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

  return (
    <li className="p-4 bg-border/20 hover:bg-border/30">
      <div className="flex flex-col gap-2.5 justify-between text-sm">
        <div className="space-x-2">
          <SelectOnClick asChild>
            <code>{name}</code>
          </SelectOnClick>
          <ParamInfos
            schema={schema}
            extraItems={[
              group !== "optional" && (
                <span className="text-primary">required</span>
              ),
              schema.type === "array" &&
                "items" in schema &&
                isCircularRef(schema.items) && <RecursiveIndicator />,
            ]}
          />
        </div>
        {schema.description && (
          <Markdown
            className={cn(ProseClasses, "text-sm leading-normal line-clamp-4")}
            content={schema.description}
          />
        )}
        {schema.type === "array" && "items" in schema && schema.items.enum && (
          <EnumValues values={schema.items.enum} />
        )}
        {schema.enum && <EnumValues values={schema.enum} />}
        <SchemaExampleAndDefault schema={schema} />
        {(hasLogicalGroupings(schema) || isComplexType(schema)) && (
          <Collapsible.Root
            defaultOpen={defaultOpen}
            open={isOpen}
            onOpenChange={() => setIsOpen(!isOpen)}
          >
            {showCollapseButton && (
              <Collapsible.Trigger asChild>
                <Button variant="expand" size="sm" className="h-7">
                  {isOpen ? <MinusIcon size={12} /> : <PlusIcon size={12} />}
                  {!isOpen ? "Show properties" : "Hide properties"}
                </Button>
              </Collapsible.Trigger>
            )}
            <Collapsible.Content>
              <div className="mt-2">
                {hasLogicalGroupings(schema) ? (
                  <SchemaLogicalGroup schema={schema} />
                ) : schema.type === "object" ? (
                  <SchemaView schema={schema} />
                ) : (
                  schema.type === "array" &&
                  "items" in schema &&
                  typeof schema.items === "object" &&
                  !isCircularRef(schema.items) && (
                    <SchemaView schema={schema.items} />
                  )
                )}
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
      </div>
    </li>
  );
};
