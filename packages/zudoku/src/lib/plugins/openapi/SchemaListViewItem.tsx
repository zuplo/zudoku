import * as Collapsible from "@radix-ui/react-collapsible";
import { ListPlusIcon } from "lucide-react";
import { Markdown } from "../../components/Markdown.js";
import { SchemaObject } from "../../oas/parser/index.js";
import { Button } from "../../ui/Button.js";
import { cn } from "../../util/cn.js";
import { SchemaListView } from "./SchemaListView.js";

export const SchemaListViewItem = ({
  propertyName,
  property,
  nestingLevel,
  isRequired,
  defaultOpen = false,
}: {
  propertyName?: string;
  isRequired: boolean;
  property: SchemaObject;
  nestingLevel: number;
  defaultOpen?: boolean;
}) => {
  if (!property) {
    return <div>no property</div>;
  }

  const title =
    propertyName || property.title
      ? [propertyName, property.title].filter(Boolean).join(" ")
      : null;

  return (
    <div
      className={cn(
        "p-4 bg-border/20 hover:bg-border/30 flex gap-1 flex-col text-sm",
        property.deprecated && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2 relative">
        {title && <code>{title}</code>}

        {property.type && (
          <span className="text-muted-foreground">{property.type}</span>
        )}
        {property.deprecated && (
          <span className="text-muted-foreground">Deprecated</span>
        )}
        {!isRequired && (
          <span className="py-px px-1.5 font-medium border rounded-lg">
            optional {property.required}
          </span>
        )}
      </div>
      {property.description && (
        <Markdown
          content={property.description}
          className="text-sm leading-normal line-clamp-4 "
        />
      )}

      {property.enum && (
        <span className="text-sm text-muted-foreground flex gap-1 flex-wrap items-center">
          <span>Possible values</span>
          {/* Make values unique, some schemas have duplicates */}
          {[...new Set(property.enum.filter((value) => value))]
            .map((value) => (
              <span
                key={value}
                className="font-mono text-xs border bg-muted rounded px-1"
              >
                {value}
              </span>
            ))
            .slice(0, 4)}
          {property.enum.length > 4 && (
            <span className="font-mono text-xs border bg-muted rounded px-1">
              ...
            </span>
          )}
        </span>
      )}

      {(property.type === "object" &&
        (property.properties?.length ??
          Object.entries(property.additionalProperties ?? {}).length > 0)) ||
      (property.type === "array" &&
        // this check is needed because the `items` can be undefined despite the type being defined
        typeof property.items !== "undefined" &&
        property.items.type === "object") ? (
        <Collapsible.Root className="CollapsibleRoot" defaultOpen={defaultOpen}>
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(defaultOpen && "hidden")}
            >
              Show nested fields
              <ListPlusIcon size={18} className="ml-1.5" />
            </Button>
          </Collapsible.Trigger>

          <Collapsible.Content>
            {property.type === "object" && (
              <div className="mt-2.5">
                <SchemaListView
                  schema={property}
                  level={nestingLevel + 1}
                  defaultOpen
                />
              </div>
            )}
            {property.type === "array" && property.items.type === "object" && (
              <div className="mt-2.5">
                <SchemaListView
                  schema={property.items}
                  defaultOpen
                  level={nestingLevel + 1}
                />
              </div>
            )}
          </Collapsible.Content>
        </Collapsible.Root>
      ) : null}
    </div>
  );
};
