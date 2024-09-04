import * as Collapsible from "@radix-ui/react-collapsible";
import { ListPlusIcon } from "lucide-react";
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

  return (
    <li className="p-4 bg-border/20 hover:bg-border/30">
      <div className="flex flex-col gap-1 justify-between text-sm">
        <div className="flex gap-2 items-center">
          <code>{name}</code>
          <span className="text-muted-foreground">
            {schema.type === "array" && schema.items.type ? (
              <span>{schema.items.type}[]</span>
            ) : Array.isArray(schema.type) ? (
              <span>{schema.type.join(" | ")}</span>
            ) : (
              <span>{schema.type}</span>
            )}
          </span>
          {group === "optional" && (
            <span className="py-px px-1.5 font-medium border rounded-lg">
              optional
            </span>
          )}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 flex gap-1.5"
                >
                  <ListPlusIcon size={18} />
                  {!isOpen
                    ? "Show nested properties"
                    : "Hide nested properties"}
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
                  typeof schema.items === "object" && (
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
