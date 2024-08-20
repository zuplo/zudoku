import type { SchemaObject } from "../../../oas/parser/index.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card.js";
import { groupBy } from "../../../util/groupBy.js";
import { SchemaLogicalGroup, SchemaPropertyItem } from "./SchemaComponents.js";
import { hasLogicalGroupings } from "./utils.js";

export const SchemaView = ({
  schema,
  level = 0,
  defaultOpen = false,
}: {
  schema: SchemaObject;
  level?: number;
  defaultOpen?: boolean;
}) => {
  const renderSchema = (schema: SchemaObject, level: number) => {
    if (schema.oneOf || schema.allOf || schema.anyOf) {
      return <SchemaLogicalGroup schema={schema} level={level} />;
    }

    if (schema.type === "array" && schema.items) {
      const itemsSchema = schema.items as SchemaObject;

      if (
        typeof itemsSchema.type === "string" &&
        ["string", "number", "boolean", "integer"].includes(itemsSchema.type)
      ) {
        return (
          <Card className="my-2">
            <CardContent>
              <strong>{`array<${itemsSchema.type}>`}</strong>
              {schema.description && <p>{schema.description}</p>}
            </CardContent>
          </Card>
        );
      } else if (
        itemsSchema.type === "object" ||
        hasLogicalGroupings(itemsSchema)
      ) {
        return (
          <Card className="flex flex-col gap-2 bg-border/30 p-4 ">
            <span className="text-sm text-muted-foreground">object[]</span>
            {renderSchema(itemsSchema, level + 1)}
          </Card>
        );
      } else {
        return renderSchema(itemsSchema, level + 1);
      }
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

      const isTopLevelSingleItem =
        level === 0 && Object.keys(groupedProperties).length === 1;

      return (
        <Card className="divide-y overflow-hidden">
          {(["required", "optional", "deprecated"] as const).map(
            (group) =>
              groupedProperties[group] && (
                <ul key={group} className="divide-y divide-border">
                  {groupedProperties[group].map(([key, value]) => (
                    <SchemaPropertyItem
                      key={key}
                      name={key}
                      value={value}
                      group={group}
                      level={level}
                      defaultOpen={isTopLevelSingleItem || defaultOpen}
                      showCollapseButton={!isTopLevelSingleItem}
                    />
                  ))}
                </ul>
              ),
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
