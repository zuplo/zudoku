import * as Collapsible from "@radix-ui/react-collapsible";
import { PlusIcon, RefreshCcwDotIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Markdown, ProseClasses } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Button } from "../../../ui/Button.js";
import { cn } from "../../../util/cn.js";
import { objectEntries } from "../../../util/objectEntries.js";
import { LogicalGroup } from "./LogicalGroup/LogicalGroup.js";
import { SchemaView } from "./SchemaView.js";
import {
  hasLogicalGroupings,
  isCircularRef,
  isComplexType,
  LogicalSchemaTypeMap,
} from "./utils.js";

export const SchemaLogicalGroup = ({
  schema,
  level,
}: {
  schema: SchemaObject;
  level: number;
}) => {
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
        level={level}
      />
    );
  }
};

const RecursiveIndicator = () => (
  <div className="flex items-center gap-2 italic text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
    <RefreshCcwDotIcon size={16} />
    <span>circular</span>
  </div>
);

export const SchemaPropertyItem = ({
  name,
  schema,
  group,
  level,
  defaultOpen = false,
  showCollapseButton = true,
}: {
  name: string;
  schema: SchemaObject;
  group: "required" | "optional" | "deprecated";
  level: number;
  defaultOpen?: boolean;
  showCollapseButton?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isCircularRef(schema)) {
    return (
      <li className="p-4 bg-border/20 hover:bg-border/30">
        <div className="flex flex-col gap-1 justify-between text-sm">
          <div className="flex gap-2 items-center">
            <code>{name}</code>
            <Badge variant="muted">object</Badge>
            {group === "optional" && <Badge variant="outline">optional</Badge>}
            <RecursiveIndicator />
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="p-4 bg-border/20 hover:bg-border/30">
      <div className="flex flex-col gap-1 justify-between text-sm">
        <div className="flex gap-2 items-center">
          <code>{name}</code>
          <span className="text-xs text-muted-foreground">
            {schema.type === "array" && schema.items.type ? (
              <span>{schema.items.type}[]</span>
            ) : Array.isArray(schema.type) ? (
              <span>{schema.type.join(" | ")}</span>
            ) : (
              <span>{schema.type}</span>
            )}
          </span>
          {group === "optional" && (
            <span className="text-xs text-muted-foreground">optional</span>
          )}
          {schema.type === "array" &&
            "items" in schema &&
            isCircularRef(schema.items) && <RecursiveIndicator />}
        </div>

        {schema.description && (
          <Markdown
            className={cn(ProseClasses, "text-sm leading-normal line-clamp-4")}
            content={schema.description}
          />
        )}

        {(hasLogicalGroupings(schema) || isComplexType(schema)) && (
          <Collapsible.Root
            defaultOpen={defaultOpen}
            open={isOpen}
            onOpenChange={() => setIsOpen(!isOpen)}
          >
            {showCollapseButton && (
              <Collapsible.Trigger asChild>
                <Button variant="expand" size="sm">
                  <PlusIcon size={16} />
                  {!isOpen ? "Show properties" : "Hide properties"}
                </Button>
              </Collapsible.Trigger>
            )}
            <Collapsible.Content>
              <div className="mt-2">
                {hasLogicalGroupings(schema) ? (
                  <SchemaLogicalGroup schema={schema} level={level + 1} />
                ) : schema.type === "object" ? (
                  <SchemaView schema={schema} level={level + 1} />
                ) : (
                  schema.type === "array" &&
                  "items" in schema &&
                  typeof schema.items === "object" &&
                  !isCircularRef(schema.items) && (
                    <SchemaView schema={schema.items} level={level + 1} />
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
