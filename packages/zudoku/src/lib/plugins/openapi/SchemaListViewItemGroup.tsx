import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import { SchemaObject } from "../../oas/parser/index.js";
import { cn } from "../../util/cn.js";
import { SchemaListViewItem } from "./SchemaListViewItem.js";

export const SchemaListViewItemGroup = ({
  group,
  properties,
  nestingLevel,
  required,
  defaultOpen = false,
}: {
  group: "optional" | "required" | "deprecated";
  defaultOpen?: boolean;
  properties: [string, SchemaObject][];
  nestingLevel: number;
  required: string[];
}) => {
  const notCollapsible =
    defaultOpen ||
    group === "required" ||
    properties.length === 1 ||
    nestingLevel === 0;

  const [open, setOpen] = useState(notCollapsible);

  if (properties.length === 0) {
    return;
  }

  return (
    <Collapsible.Root
      className="CollapsibleRoot"
      open={open}
      onOpenChange={setOpen}
    >
      {!open && (
        <Collapsible.Trigger
          className={cn(
            "py-2 hover:bg-muted w-full",
            group === "optional" && "font-semibold",
            group === "deprecated" && "text-muted-foreground",
          )}
        >
          {properties.length} {group} fields
        </Collapsible.Trigger>
      )}

      <Collapsible.Content className="divide-y divide-border">
        {properties.map(([propertyName, property]) => (
          <SchemaListViewItem
            key={propertyName}
            property={property}
            propertyName={propertyName}
            nestingLevel={nestingLevel}
            isRequired={required.includes(propertyName)}
          />
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
