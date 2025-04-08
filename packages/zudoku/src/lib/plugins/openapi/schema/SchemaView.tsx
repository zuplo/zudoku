import { Markdown, ProseClasses } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card.js";
import { cn } from "../../../util/cn.js";
import { groupBy } from "../../../util/groupBy.js";
import { EnumValues } from "../components/EnumValues.js";
import { ParamInfos } from "../ParamInfos.js";
import { SchemaExampleAndDefault } from "./SchemaExampleAndDefault.js";
import {
  SchemaLogicalGroup,
  SchemaPropertyItem,
} from "./SchemaPropertyItem.js";
import { hasLogicalGroupings, isBasicType } from "./utils.js";

const renderMarkdown = (content?: string) =>
  content && (
    <Markdown
      className={cn(ProseClasses, "text-sm leading-normal line-clamp-4")}
      content={content}
    />
  );

const renderBasicSchema = (schema: SchemaObject) => (
  <Card className="p-4 space-y-2">
    <span className="text-sm text-muted-foreground">
      <ParamInfos schema={schema} />
    </span>
    {schema.enum && <EnumValues values={schema.enum} />}
    {renderMarkdown(schema.description)}
    <SchemaExampleAndDefault schema={schema} />
  </Card>
);

export const SchemaView = ({
  schema,
  defaultOpen = false,
}: {
  schema?: SchemaObject | null;
  defaultOpen?: boolean;
}) => {
  if (!schema || Object.keys(schema).length === 0) {
    return (
      <Card className="p-4">
        <span className="text-sm text-muted-foreground italic">
          No schema specified
        </span>
      </Card>
    );
  }

  if (hasLogicalGroupings(schema)) {
    return <SchemaLogicalGroup schema={schema} />;
  }

  if (isBasicType(schema.type)) {
    return renderBasicSchema(schema);
  }

  if (schema.type === "array" && typeof schema.items === "object") {
    return (
      <Card className="p-4 space-y-2 text-sm">
        <ParamInfos schema={schema} />
        <SchemaView schema={schema.items as SchemaObject} />
      </Card>
    );
  }

  if (schema.type === "object") {
    const groupedProperties = groupBy(
      Object.entries(schema.properties ?? {}),
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
                    defaultOpen={defaultOpen}
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
          <SchemaView schema={schema.additionalProperties as SchemaObject} />
        </CardContent>
      </Card>
    );
  }

  return null;
};
