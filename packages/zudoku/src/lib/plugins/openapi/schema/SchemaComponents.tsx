import * as Collapsible from "@radix-ui/react-collapsible";
import { ListPlusIcon } from "lucide-react";
import { useState } from "react";
import { Markdown, ProseClasses } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Button } from "../../../ui/Button.js";
import { cn } from "../../../util/cn.js";
import { SchemaView } from "./SchemaView.js";
import { hasLogicalGroupings, isComplexType } from "./utils.js";

export const SchemaLogicalGroup = ({
  schema,
  level,
}: {
  schema: SchemaObject;
  level: number;
}) => {
  const renderLogicalGroup = (
    group: SchemaObject[],
    groupName: string,
    separator: string,
  ) => {
    return group.map((subSchema, index) => (
      <div key={index} className="my-2">
        <strong>{groupName}</strong>
        <div className="mt-2">
          <SchemaView schema={subSchema} level={level + 1} />
          {index < group.length - 1 && (
            <div className="text-center my-2">{separator}</div>
          )}
        </div>
      </div>
    ));
  };

  if (schema.oneOf) return renderLogicalGroup(schema.oneOf, "One of", "OR");
  if (schema.allOf) return renderLogicalGroup(schema.allOf, "All of", "AND");
  if (schema.anyOf) return renderLogicalGroup(schema.anyOf, "Any of", "OR");

  return null;
};

export const SchemaPropertyItem = ({
  name,
  value,
  group,
  level,
  defaultOpen = false,
  showCollapseButton = true,
}: {
  name: string;
  value: SchemaObject;
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
            {value.type === "array" && value.items?.type ? (
              <span>{value.items.type}[]</span>
            ) : Array.isArray(value.type) ? (
              <span>{value.type.join(" | ")}</span>
            ) : (
              <span>{value.type}</span>
            )}
          </span>
          {group === "optional" && (
            <span className="py-px px-1.5 font-medium border rounded-lg">
              optional
            </span>
          )}
        </div>

        {value.description && (
          <Markdown
            className={cn(ProseClasses, "text-sm leading-normal line-clamp-4")}
            content={value.description}
          />
        )}

        {(hasLogicalGroupings(value) ?? isComplexType(value)) && (
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
                {hasLogicalGroupings(value) && (
                  <SchemaLogicalGroup schema={value} level={level + 1} />
                )}
                {value.type === "object" && (
                  <SchemaView schema={value} level={level + 1} />
                )}
                {value.type === "array" && typeof value.items === "object" && (
                  <SchemaView schema={value.items} level={level + 1} />
                )}
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
      </div>
    </li>
  );
};
