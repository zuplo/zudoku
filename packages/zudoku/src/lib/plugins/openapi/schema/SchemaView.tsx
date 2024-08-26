import { Markdown, ProseClasses } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card.js";
import { cn } from "../../../util/cn.js";
import { groupBy } from "../../../util/groupBy.js";
import { SchemaLogicalGroup, SchemaPropertyItem } from "./SchemaComponents.js";
import { hasLogicalGroupings } from "./utils.js";

export const SchemaView = ({
  schema,
  level = 0,
  defaultOpen = false,
}: {
  schema?: SchemaObject | null;
  level?: number;
  defaultOpen?: boolean;
}) => {
  if (!schema || Object.keys(schema).length === 0) {
    return (
      <Card className="p-4">
        <span className="text-sm text-muted-foreground italic">
          No response specified
        </span>
      </Card>
    );
  }

  const renderSchema = (schema: SchemaObject, level: number) => {
    if (hasLogicalGroupings(schema)) {
      return <SchemaLogicalGroup schema={schema} level={level} />;
    }

    // Sometimes items is not defined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (schema.type === "array" && schema.items) {
      const itemsSchema = schema.items as SchemaObject;

      if (
        typeof itemsSchema.type === "string" &&
        ["string", "number", "boolean", "integer"].includes(itemsSchema.type)
      ) {
        return (
          <Card className="p-4">
            <span className="text-sm text-muted-foreground">
              {itemsSchema.type}[]
            </span>
            {schema.description && (
              <Markdown
                className={cn(
                  ProseClasses,
                  "text-sm leading-normal line-clamp-4",
                )}
                content={schema.description}
              />
            )}
          </Card>
        );
      } else if (itemsSchema.type === "object") {
        return (
          <Card className="flex flex-col gap-2 bg-border/30 p-4">
            <span className="text-sm text-muted-foreground">object[]</span>
            {renderSchema(itemsSchema, level + 1)}
          </Card>
        );
      } else {
        return renderSchema(itemsSchema, level + 1);
      }
    }

    if (schema.type === "object" && !schema.properties) {
      return (
        <Card className="p-4 flex gap-2 items-center">
          {"name" in schema && <>{schema.name}</>}
          <span className="text-sm text-muted-foreground">object</span>
          {schema.description && (
            <Markdown
              className={cn(
                ProseClasses,
                "text-sm leading-normal line-clamp-4",
              )}
              content={schema.description}
            />
          )}
        </Card>
      );
    }

    if (schema.properties) {
      const groupedProperties = groupBy(
        Object.entries(schema.properties),
        ([propertyName, property]) => {
          return property.deprecated
            ? "deprecated"
            : schema.required?.includes(propertyName)
              ? "required"
              : "optional";
        },
      );

      const groupNames = ["required", "optional", "deprecated"] as const;

      return (
        <Card className="divide-y overflow-hidden">
          {groupNames.map(
            (group) =>
              groupedProperties[group] && (
                <ul key={group} className="divide-y">
                  {groupedProperties[group].map(([name, schema]) => (
                    <SchemaPropertyItem
                      key={name}
                      name={name}
                      schema={schema}
                      group={group}
                      level={level}
                      defaultOpen={defaultOpen}
                    />
                  ))}
                </ul>
              ),
          )}
        </Card>
      );
    }

    if (
      typeof schema.type === "string" &&
      ["string", "number", "boolean", "integer", "null"].includes(schema.type)
    ) {
      return (
        <Card className="p-4">
          <span className="text-sm text-muted-foreground">{schema.type}</span>
          {schema.description && (
            <Markdown
              className={cn(
                ProseClasses,
                "text-sm leading-normal line-clamp-4",
              )}
              content={schema.description}
            />
          )}
        </Card>
      );
    }

    if (schema.additionalProperties) {
      return (
        <Card className="my-2">
          <CardHeader>
            <CardTitle>Additional Properties:</CardTitle>
          </CardHeader>
          <CardContent>
            {renderSchema(
              schema.additionalProperties as SchemaObject,
              level + 1,
            )}
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return renderSchema(schema, level);
};
